import mongoose, { Schema, Document } from "mongoose";

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface IGroup {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  members: IGroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupDocument extends IGroup, Document {}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroupDocument>(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [groupMemberSchema],
  },
  {
    timestamps: true,
  }
);

groupSchema.index({ "members.userId": 1 });
groupSchema.index({ createdBy: 1 });

export const Group = mongoose.model<IGroupDocument>("Group", groupSchema);
