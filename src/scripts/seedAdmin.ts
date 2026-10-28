import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User, UserRole } from "../models/user_model";

dotenv.config();

const seedAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log("Admin already exists");
  } else {
    await User.create({
      name: "Admin",
      email,
      password, // hashed by the model's pre-save hook
      role: UserRole.ADMIN,
      isApproved: true,
    });
    console.log("Admin created");
  }

  await mongoose.disconnect();
};

seedAdmin().catch((err: Error) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});