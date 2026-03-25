import { Category } from "@/models/Category";
import { DEFAULT_CATEGORIES } from "@/data/defaultCategories";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/schemas/category.schema";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

const MAX_CATEGORIES_PER_USER = 50;

export async function seedDefaultCategories(userId: string) {
  const existing = await Category.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (existing > 0) {
    return;
  }

  const docs = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    userId: new mongoose.Types.ObjectId(userId),
    isDefault: true,
  }));

  await Category.insertMany(docs);
  logger.info("Default categories seeded", { userId, count: docs.length });
}

export async function getUserCategories(userId: string, activeOnly = true) {
  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (activeOnly) {
    filter.isActive = true;
  }

  const categories = await Category.find(filter).sort({ order: 1 });
  return categories;
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  const count = await Category.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (count >= MAX_CATEGORIES_PER_USER) {
    throw new Error(`Maximum of ${MAX_CATEGORIES_PER_USER} categories allowed`);
  }

  // Auto-assign order as the next available
  const maxOrderDoc = await Category.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ order: -1 });

  const nextOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 0;

  const category = await Category.create({
    ...input,
    userId: new mongoose.Types.ObjectId(userId),
    order: nextOrder,
  });

  logger.info("Category created", { categoryId: category._id, userId });
  return category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput
) {
  const category = await Category.findOne({
    _id: categoryId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!category) return null;

  const updated = await Category.findByIdAndUpdate(
    categoryId,
    { $set: input },
    { new: true, runValidators: true }
  );

  if (updated) logger.info("Category updated", { categoryId });
  return updated;
}

export async function deleteCategory(userId: string, categoryId: string) {
  const category = await Category.findOne({
    _id: categoryId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!category) return null;

  if (category.name === "Other") {
    throw new Error("Cannot delete the 'Other' category");
  }

  await Category.findByIdAndDelete(categoryId);
  logger.info("Category deleted", { categoryId, userId });
  return true;
}

export async function reorderCategories(userId: string, categoryIds: string[]) {
  const bulkOps = categoryIds.map((id, index) => ({
    updateOne: {
      filter: {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      update: { $set: { order: index } },
    },
  }));

  const result = await Category.bulkWrite(bulkOps);
  logger.info("Categories reordered", { userId, count: result.modifiedCount });
  return result.modifiedCount;
}
