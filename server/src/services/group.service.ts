import { Group } from "@/models/Group";
import { GroupExpense } from "@/models/GroupExpense";
import { Settlement } from "@/models/Settlement";
import { User } from "@/models/User";
import type { CreateGroupInput, UpdateGroupInput } from "@/schemas/group.schema";
import { createPaginationMeta } from "@/utils/pagination";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

export async function createGroup(userId: string, input: CreateGroupInput) {
  const group = await Group.create({
    name: input.name,
    description: input.description,
    createdBy: userId,
    members: [{ userId, role: "admin", joinedAt: new Date() }],
  });

  logger.info("Group created", { groupId: group._id, userId });
  return group;
}

export async function findGroupById(groupId: string) {
  return Group.findById(groupId)
    .populate("createdBy", "email firstName lastName name")
    .populate("members.userId", "email firstName lastName name");
}

export async function updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
  const group = await Group.findById(groupId);
  if (!group) return null;

  const isAdmin = group.members.some(
    (m) => m.userId.toString() === userId && m.role === "admin"
  );
  if (!isAdmin) throw new Error("Only admins can update the group");

  const updated = await Group.findByIdAndUpdate(
    groupId,
    { $set: input },
    { new: true, runValidators: true }
  )
    .populate("createdBy", "email firstName lastName name")
    .populate("members.userId", "email firstName lastName name");

  if (updated) logger.info("Group updated", { groupId });
  return updated;
}

export async function deleteGroup(groupId: string, userId: string) {
  const group = await Group.findById(groupId);
  if (!group) return false;

  if (group.createdBy.toString() !== userId) {
    throw new Error("Only the creator can delete the group");
  }

  // Cascade delete associated data
  await Promise.all([
    GroupExpense.deleteMany({ groupId }),
    Settlement.deleteMany({ groupId }),
    Group.findByIdAndDelete(groupId),
  ]);
  logger.info("Group deleted with associated data", { groupId });
  return true;
}

export async function addMember(groupId: string, userId: string, memberEmail: string) {
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  const isAdmin = group.members.some(
    (m) => m.userId.toString() === userId && m.role === "admin"
  );
  if (!isAdmin) throw new Error("Only admins can add members");

  const newMember = await User.findOne({ email: memberEmail.toLowerCase() });
  if (!newMember) throw new Error("User not found with that email");

  const alreadyMember = group.members.some(
    (m) => m.userId.toString() === newMember._id.toString()
  );
  if (alreadyMember) throw new Error("User is already a member");

  group.members.push({
    userId: newMember._id,
    role: "member",
    joinedAt: new Date(),
  } as any);

  await group.save();

  const populated = await Group.findById(groupId)
    .populate("createdBy", "email firstName lastName name")
    .populate("members.userId", "email firstName lastName name");

  logger.info("Member added to group", { groupId, memberId: newMember._id });
  return populated;
}

export async function removeMember(groupId: string, userId: string, memberIdToRemove: string) {
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  const isAdmin = group.members.some(
    (m) => m.userId.toString() === userId && m.role === "admin"
  );
  if (!isAdmin && userId !== memberIdToRemove) {
    throw new Error("Only admins can remove other members");
  }

  if (group.createdBy.toString() === memberIdToRemove) {
    throw new Error("Cannot remove the group creator");
  }

  group.members = group.members.filter(
    (m) => m.userId.toString() !== memberIdToRemove
  ) as any;

  await group.save();
  logger.info("Member removed from group", { groupId, memberId: memberIdToRemove });
  return true;
}

export async function findGroupsByMember(
  userId: string,
  options: { page: number; limit: number }
) {
  const filter = { "members.userId": new mongoose.Types.ObjectId(userId) };

  const [groups, total] = await Promise.all([
    Group.find(filter)
      .populate("createdBy", "email firstName lastName name")
      .populate("members.userId", "email firstName lastName name")
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Group.countDocuments(filter),
  ]);

  return { groups, total };
}
