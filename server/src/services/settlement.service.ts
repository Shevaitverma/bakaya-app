import { Settlement } from "@/models/Settlement";
import { Group } from "@/models/Group";
import type { CreateSettlementInput } from "@/schemas/settlement.schema";
import { createPaginationMeta } from "@/utils/pagination";
import { getGroupBalances } from "@/services/groupExpense.service";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";
import { sendToUser, getUserDisplayName } from "@/services/notification.service";

// What paidBy currently owes paidTo, so we can reject settlements larger than
// the outstanding pairwise balance. Bounded by min(|debtorNet|, creditorNet)
// when both signs align. Exported for tests: suggestTransfers must never
// propose a payment this cap would then refuse.
export function pairwiseOwed(
  balances: Record<string, number>,
  paidBy: string,
  paidTo: string
): number {
  const debtorNet = balances[paidBy] || 0; // negative ⇒ owes money
  const creditorNet = balances[paidTo] || 0; // positive ⇒ is owed
  if (debtorNet >= 0 || creditorNet <= 0) return 0;
  return Math.min(Math.abs(debtorNet), creditorNet);
}

async function computePairwiseOwed(
  groupId: string,
  paidBy: string,
  paidTo: string
): Promise<number> {
  return pairwiseOwed(await getGroupBalances(groupId), paidBy, paidTo);
}

export async function createSettlement(
  groupId: string,
  input: CreateSettlementInput
) {
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  const isPaidByMember = group.members.some(
    (m) => m.userId.toString() === input.paidBy
  );
  if (!isPaidByMember) throw new Error("paidBy user is not a member of this group");

  const isPaidToMember = group.members.some(
    (m) => m.userId.toString() === input.paidTo
  );
  if (!isPaidToMember) throw new Error("paidTo user is not a member of this group");

  if (input.paidBy === input.paidTo) {
    throw new Error("paidBy and paidTo cannot be the same user");
  }

  // Reject overpayment — cap at the current pairwise owed balance.
  const owed = await computePairwiseOwed(groupId, input.paidBy, input.paidTo);
  if (input.amount - owed > 0.01) {
    throw new Error(
      `Settlement amount (${input.amount}) exceeds the outstanding balance (${owed.toFixed(2)})`
    );
  }

  const settlement = await Settlement.create({
    groupId,
    paidBy: input.paidBy,
    paidTo: input.paidTo,
    amount: input.amount,
    notes: input.notes,
  });

  logger.info("Settlement created", { groupId, settlementId: settlement._id });

  // Fire-and-forget push to the counterparty who received the payment.
  void (async () => {
    const payerName = await getUserDisplayName(input.paidBy);
    await sendToUser(input.paidTo, {
      title: group.name,
      body: `${payerName} settled ₹${input.amount} with you`,
      data: { type: "group", groupId: group._id.toString() },
    });
  })().catch((error) => logger.error("Settlement push failed", { error }));

  return settlement;
}

export async function findSettlementsByGroup(
  groupId: string,
  options: { page: number; limit: number }
) {
  const filter = { groupId: new mongoose.Types.ObjectId(groupId) };

  const [settlements, total] = await Promise.all([
    Settlement.find(filter)
      .populate("paidBy", "email firstName lastName name")
      .populate("paidTo", "email firstName lastName name")
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Settlement.countDocuments(filter),
  ]);

  return {
    settlements,
    total,
    pagination: createPaginationMeta(options.page, options.limit, total),
  };
}

export async function deleteSettlement(
  settlementId: string,
  groupId: string
) {
  return Settlement.findOneAndDelete({
    _id: settlementId,
    groupId: new mongoose.Types.ObjectId(groupId),
  });
}
