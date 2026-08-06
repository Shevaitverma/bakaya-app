import mongoose, { Schema, Document } from "mongoose";

export type SplitType = "equal" | "exact" | "percentage";

export interface IGroupExpenseSplit {
  userId: mongoose.Types.ObjectId;
  amount: number;
  // Only set when splitType is "percentage", so an edit can reopen the exact
  // percentages instead of guessing them back from the rounded amounts.
  // `amount` stays the source of truth for balances.
  percentage?: number;
}

export interface IGroupExpense {
  groupId: mongoose.Types.ObjectId;
  paidBy: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  splitType: SplitType;
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
    percentage: {
      type: Number,
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
    // Pre-existing documents have no splitType, and Mongoose fills this default
    // in on hydration — so it decides how every legacy expense reopens for edit.
    // "exact" is the only lossless answer: the stored amounts are replayed as-is
    // whether or not they happen to be equal. Defaulting to "equal" would make
    // the edit screen re-split an old uneven split evenly on save.
    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage"],
      default: "exact",
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
