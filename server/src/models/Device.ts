import mongoose, { Schema, Document } from "mongoose";

export interface IDevice {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  os?: string;
  osVersion?: string;
  fcmToken?: string;
  isActive: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeviceDocument extends IDevice, Document {}

const deviceSchema = new Schema<IDeviceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    os: { type: String },
    osVersion: { type: String },
    fcmToken: { type: String },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { __v, _id, ...rest } = ret;
        return { id: _id, ...rest };
      },
    },
  }
);

deviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const Device = mongoose.model<IDeviceDocument>("Device", deviceSchema);
