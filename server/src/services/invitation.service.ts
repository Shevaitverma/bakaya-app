import { Group } from "@/models/Group";
import { GroupInvitation, type GroupInvitationStatus } from "@/models/GroupInvitation";
import { User } from "@/models/User";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

const INVITATION_POPULATE = [
  { path: "groupId", select: "name description members" },
  { path: "invitedBy", select: "email firstName lastName name" },
  { path: "invitedUserId", select: "email firstName lastName name" },
] as const;

function isGroupAdmin(group: { members: Array<{ userId: mongoose.Types.ObjectId | string; role: string }> }, userId: string) {
  return group.members.some(
    (m) => m.userId.toString() === userId && m.role === "admin"
  );
}

export async function createInvitation(
  groupId: string,
  inviterUserId: string,
  email: string,
  message?: string
) {
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  if (!isGroupAdmin(group, inviterUserId)) {
    throw new Error("Only admins can invite members");
  }

  const normalizedEmail = email.toLowerCase();
  const invitedUser = await User.findOne({ email: normalizedEmail });
  if (!invitedUser) throw new Error("No registered user with that email");

  if (invitedUser._id.toString() === inviterUserId) {
    throw new Error("You cannot invite yourself");
  }

  const alreadyMember = group.members.some(
    (m) => m.userId.toString() === invitedUser._id.toString()
  );
  if (alreadyMember) throw new Error("User is already a member");

  const existingPending = await GroupInvitation.findOne({
    groupId: group._id,
    invitedUserId: invitedUser._id,
    status: "pending",
  });
  if (existingPending) throw new Error("A pending invitation already exists for this user");

  const invitation = await GroupInvitation.create({
    groupId: group._id,
    invitedBy: new mongoose.Types.ObjectId(inviterUserId),
    invitedEmail: normalizedEmail,
    invitedUserId: invitedUser._id,
    message,
  });

  const populated = await GroupInvitation.findById(invitation._id).populate(
    INVITATION_POPULATE as any
  );

  logger.info("Group invitation created", {
    invitationId: invitation._id,
    groupId,
    invitedUserId: invitedUser._id,
  });
  return populated;
}

export async function listGroupInvitations(
  groupId: string,
  requestingUserId: string,
  options: { status?: GroupInvitationStatus } = {}
) {
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  if (!isGroupAdmin(group, requestingUserId)) {
    throw new Error("Only admins can view invitations");
  }

  const filter: Record<string, unknown> = { groupId: group._id };
  if (options.status) filter.status = options.status;

  return GroupInvitation.find(filter)
    .populate(INVITATION_POPULATE as any)
    .sort({ createdAt: -1 });
}

export async function cancelInvitation(
  groupId: string,
  invitationId: string,
  requestingUserId: string
) {
  const invitation = await GroupInvitation.findOne({
    _id: invitationId,
    groupId,
  });
  if (!invitation) throw new Error("Invitation not found");

  if (invitation.status !== "pending") {
    throw new Error("Invitation is no longer pending");
  }

  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  const isInviter = invitation.invitedBy.toString() === requestingUserId;
  const isAdmin = isGroupAdmin(group, requestingUserId);
  if (!isInviter && !isAdmin) {
    throw new Error("Only the inviter or a group admin can cancel this invitation");
  }

  invitation.status = "cancelled";
  invitation.respondedAt = new Date();
  await invitation.save();

  const populated = await GroupInvitation.findById(invitation._id).populate(
    INVITATION_POPULATE as any
  );

  logger.info("Group invitation cancelled", {
    invitationId: invitation._id,
    groupId,
    requestingUserId,
  });
  return populated;
}

export async function listMyInvitations(
  userId: string,
  options: { status?: GroupInvitationStatus } = {}
) {
  const status = options.status ?? "pending";
  const filter: Record<string, unknown> = {
    invitedUserId: new mongoose.Types.ObjectId(userId),
    status,
  };

  // Hide expired pending invitations from the user's list
  if (status === "pending") {
    filter.expiresAt = { $gt: new Date() };
  }

  return GroupInvitation.find(filter)
    .populate(INVITATION_POPULATE as any)
    .sort({ createdAt: -1 });
}

async function loadPendingInvitationForUser(invitationId: string, userId: string) {
  const invitation = await GroupInvitation.findById(invitationId);
  if (!invitation) throw new Error("Invitation not found");

  if (invitation.invitedUserId.toString() !== userId) {
    throw new Error("This invitation is not for you");
  }

  if (invitation.status !== "pending") {
    throw new Error("Invitation is no longer pending");
  }

  if (invitation.expiresAt && invitation.expiresAt.getTime() <= Date.now()) {
    throw new Error("Invitation has expired");
  }

  return invitation;
}

export async function acceptInvitation(invitationId: string, userId: string) {
  const invitation = await loadPendingInvitationForUser(invitationId, userId);

  const group = await Group.findById(invitation.groupId);
  if (!group) throw new Error("Group not found");

  const alreadyMember = group.members.some(
    (m) => m.userId.toString() === userId
  );
  if (!alreadyMember) {
    group.members.push({
      userId: new mongoose.Types.ObjectId(userId),
      role: "member",
      joinedAt: new Date(),
    } as any);
    await group.save();
  }

  invitation.status = "accepted";
  invitation.respondedAt = new Date();
  await invitation.save();

  const [populatedInvitation, populatedGroup] = await Promise.all([
    GroupInvitation.findById(invitation._id).populate(INVITATION_POPULATE as any),
    Group.findById(group._id)
      .populate("createdBy", "email firstName lastName name")
      .populate("members.userId", "email firstName lastName name"),
  ]);

  logger.info("Group invitation accepted", {
    invitationId: invitation._id,
    groupId: group._id,
    userId,
  });

  return { invitation: populatedInvitation, group: populatedGroup };
}

export async function declineInvitation(invitationId: string, userId: string) {
  const invitation = await loadPendingInvitationForUser(invitationId, userId);

  invitation.status = "declined";
  invitation.respondedAt = new Date();
  await invitation.save();

  const populated = await GroupInvitation.findById(invitation._id).populate(
    INVITATION_POPULATE as any
  );

  logger.info("Group invitation declined", {
    invitationId: invitation._id,
    groupId: invitation.groupId,
    userId,
  });
  return populated;
}
