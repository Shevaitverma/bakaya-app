import { Settlement } from "@/models/Settlement";
import { Group } from "@/models/Group";
import type { CreateSettlementInput } from "@/schemas/settlement.schema";
import { createPaginationMeta } from "@/utils/pagination";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

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

  const settlement = await Settlement.create({
    groupId,
    paidBy: input.paidBy,
    paidTo: input.paidTo,
    amount: input.amount,
    notes: input.notes,
  });

  logger.info("Settlement created", { groupId, settlementId: settlement._id });
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
