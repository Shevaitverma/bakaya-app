import mongoose, { Schema, Document } from "mongoose";

export type GroupInvitationStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface IGroupInvitation {
  groupId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  invitedEmail: string;
  invitedUserId: mongoose.Types.ObjectId;
  status: GroupInvitationStatus;
  message?: string;
  respondedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupInvitationDocument extends IGroupInvitation, Document {}

const INVITATION_TTL_DAYS = 30;

function defaultExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + INVITATION_TTL_DAYS);
  return d;
}

const groupInvitationSchema = new Schema<IGroupInvitationDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedEmail: {
      type: String,
      required: [true, "Invited email is required"],
      lowercase: true,
      trim: true,
    },
    invitedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [200, "Message cannot exceed 200 characters"],
    },
    respondedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: defaultExpiresAt,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "groupinvitations",
  }
);

// Enforce at most one active pending invitation per (group, user)
groupInvitationSchema.index(
  { groupId: 1, invitedUserId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

groupInvitationSchema.index({ invitedUserId: 1, status: 1 });

export const GroupInvitation = mongoose.model<IGroupInvitationDocument>(
  "GroupInvitation",
  groupInvitationSchema
);
