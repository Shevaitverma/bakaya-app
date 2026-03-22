import { Profile } from "@/models/Profile";
import { Expense } from "@/models/Expense";
import type { CreateProfileInput, UpdateProfileInput } from "@/schemas/profile.schema";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

export async function createProfile(userId: string, input: CreateProfileInput) {
  const profile = await Profile.create({
    ...input,
    userId,
  });

  logger.info("Profile created", { profileId: profile._id, userId });
  return profile;
}

export async function createDefaultProfile(userId: string, userName?: string) {
  const existing = await Profile.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    isDefault: true,
  });

  if (existing) {
    return existing;
  }

  const profileName = userName?.trim() || "Self";

  const profile = await Profile.create({
    userId,
    name: profileName,
    relationship: "self",
    isDefault: true,
  });

  logger.info("Default profile created", { profileId: profile._id, userId });
  return profile;
}

export async function findProfilesByUser(
  userId: string,
  options: { page: number; limit: number }
) {
  const filter = { userId: new mongoose.Types.ObjectId(userId) };

  const [profiles, total] = await Promise.all([
    Profile.find(filter)
      .sort({ isDefault: -1, createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Profile.countDocuments(filter),
  ]);

  return { profiles, total };
}

export async function findProfileById(profileId: string) {
  return Profile.findById(profileId);
}

export async function updateProfile(
  profileId: string,
  userId: string,
  input: UpdateProfileInput
) {
  const profile = await Profile.findOne({
    _id: profileId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!profile) return null;

  const updated = await Profile.findByIdAndUpdate(
    profileId,
    { $set: input },
    { new: true, runValidators: true }
  );

  if (updated) logger.info("Profile updated", { profileId });
  return updated;
}

export async function deleteProfile(profileId: string, userId: string) {
  const profile = await Profile.findOne({
    _id: profileId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!profile) return null;

  if (profile.isDefault) {
    throw new Error("Cannot delete the default profile");
  }

  // Check if profile has linked expenses
  const expenseCount = await Expense.countDocuments({
    profileId: new mongoose.Types.ObjectId(profileId),
  });

  if (expenseCount > 0) {
    throw new Error("Cannot delete profile with linked expenses");
  }

  await Profile.findByIdAndDelete(profileId);
  logger.info("Profile deleted", { profileId, userId });
  return true;
}
