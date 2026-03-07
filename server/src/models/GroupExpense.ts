import mongoose, { Schema, Document } from "mongoose";

export interface IGroupExpenseSplit {
  userId: mongoose.Types.ObjectId;
  amount: number;
}

export interface IGroupExpense {
  groupId: mongoose.Types.ObjectId;
  paidBy: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  splitAmong: IGroupExpenseSplit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupExpenseDocument extends IGroupExpense, Document {}

const groupExpenseSplitSchema = new Schema<IGroupExpenseSplit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const groupExpenseSchema = new Schema<IGroupExpenseDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be non-negative"],
    },
    category: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    splitAmong: [groupExpenseSplitSchema],
  },
  {
    timestamps: true,
    collection: "groupexpenses",
  }
);

groupExpenseSchema.index({ groupId: 1, createdAt: -1 });

export const GroupExpense = mongoose.model<IGroupExpenseDocument>("GroupExpense", groupExpenseSchema);
