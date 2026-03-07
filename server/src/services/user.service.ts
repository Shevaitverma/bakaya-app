import { User, type IUserDocument } from "@/models/User";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
} from "@/schemas/user.schema";
import { createPaginationMeta } from "@/utils/pagination";
import { logger } from "@/utils/logger";

export class UserService {
  async create(input: CreateUserInput): Promise<IUserDocument> {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const user = new User(input);
    await user.save();

    logger.info("User created", { userId: user._id });
    return user;
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findByEmail(email);
  }

  async update(
    id: string,
    input: UpdateUserInput
  ): Promise<IUserDocument | null> {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (user) {
      logger.info("User updated", { userId: id });
    }

    return user;
  }

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    if (result) {
      logger.info("User deleted", { userId: id });
      return true;
    }
    return false;
  }

  async findMany(query: UserQueryInput) {
    const { page, limit, role, isActive, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: createPaginationMeta(page, limit, total),
    };
  }
}

export const userService = new UserService();
