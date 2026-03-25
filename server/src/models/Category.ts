import mongoose, { Schema, Document } from "mongoose";

export interface ICategory {
  userId: mongoose.Types.ObjectId;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends ICategory, Document {}

const categorySchema = new Schema<ICategoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 30 },
    emoji: { type: String, required: true, default: "📄" },
    color: { type: String, required: true, default: "#6B7280", match: /^#[0-9A-Fa-f]{6}$/ },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "categories",
    toJSON: {
      transform(_doc, ret) {
        const { __v, _id, ...rest } = ret;
        return { id: _id, ...rest };
      },
    },
  }
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
categorySchema.index({ userId: 1, isActive: 1, order: 1 });

export const Category = mongoose.model<ICategoryDocument>("Category", categorySchema);
