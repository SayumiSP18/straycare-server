import { Document, Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

export enum UserRole {
  ADMIN = "ADMIN",
  RESCUER = "RESCUER",
  CITIZEN = "CITIZEN",
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isApproved: boolean;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CITIZEN,
    },
    isApproved: { type: Boolean, default: true },
    refreshTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);