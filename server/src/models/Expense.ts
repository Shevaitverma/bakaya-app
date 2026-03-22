import mongoose, { Schema, Document } from "mongoose";

export interface IExpense {
  userId: mongoose.Types.ObjectId;
  profileId?: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpenseDocument extends IExpense, Document {}

const expenseSchema = new Schema<IExpenseDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      index: true,
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
  },
  {
    timestamps: true,
    collection: "personalexpenses",
  }
);

expenseSchema.index({ userId: 1, createdAt: -1 });
expenseSchema.index({ userId: 1, profileId: 1, createdAt: -1 });

export const Expense = mongoose.model<IExpenseDocument>("Expense", expenseSchema);
