import mongoose, { Schema, Document } from "mongoose";

export interface IProfile {
  userId: mongoose.Types.ObjectId;
  name: string;
  relationship?: string;
  avatar?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfileDocument extends IProfile, Document {}

const profileSchema = new Schema<IProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Profile name is required"],
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "profiles",
  }
);

profileSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Profile = mongoose.model<IProfileDocument>("Profile", profileSchema);
