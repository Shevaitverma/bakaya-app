import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  password: string;
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { password, __v, _id, ...rest } = ret;
        // Compute name from firstName/lastName if not stored
        if (!rest.name && (rest.firstName || rest.lastName)) {
          rest.name = [rest.firstName, rest.lastName].filter(Boolean).join(" ");
        }
        return { id: _id, ...rest };
      },
    },
  }
);

// Indexes
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, isActive: 1 });

// Auto-compute name from firstName + lastName
userSchema.pre("validate", function (next) {
  if (this.firstName || this.lastName) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(" ");
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  // Using Bun's built-in password hashing
  this.password = await Bun.password.hash(this.password, {
    algorithm: "bcrypt",
    cost: 12,
  });
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return Bun.password.verify(candidatePassword, this.password);
};

// Static method to find by email
userSchema.statics.findByEmail = function (
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() }).select("+password");
};

export const User = mongoose.model<IUserDocument, IUserModel>(
  "User",
  userSchema
);
