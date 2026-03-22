import mongoose, { Schema, Document } from "mongoose";

export interface ISettlement {
  groupId: mongoose.Types.ObjectId;
  paidBy: mongoose.Types.ObjectId;
  paidTo: mongoose.Types.ObjectId;
  amount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettlementDocument extends ISettlement, Document {}

const settlementSchema = new Schema<ISettlementDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paidTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be non-negative"],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "settlements",
  }
);

settlementSchema.index({ groupId: 1, createdAt: -1 });

export const Settlement = mongoose.model<ISettlementDocument>("Settlement", settlementSchema);
