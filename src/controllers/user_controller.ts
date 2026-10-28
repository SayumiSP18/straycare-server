import { Request, Response } from "express";
import mongoose from "mongoose";
import { User, UserRole } from "../models/user_model";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    const { role, approved } = req.query;

    if (typeof role === "string" && Object.values(UserRole).includes(role as UserRole)) {
      filter.role = role;
    }
    if (typeof approved === "string") {
      filter.isApproved = approved === "true";
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Users fetched", data: users });
  } catch (error) {
    console.error("GetUsers error:", error);
    res.status(500).json({ success: false, message: "Could not fetch users" });
  }
};

export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid user id" });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    if (user.role !== UserRole.RESCUER) {
      res.status(400).json({ success: false, message: "Only rescuer accounts need approval" });
      return;
    }

    user.isApproved = true;
    await user.save();
    res.status(200).json({ success: true, message: "Rescuer approved", data: user });
  } catch (error) {
    console.error("ApproveUser error:", error);
    res.status(500).json({ success: false, message: "Could not approve user" });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid user id" });
      return;
    }
    if (id === req.user?.id) {
      res.status(400).json({ success: false, message: "You cannot delete your own account" });
      return;
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("DeleteUser error:", error);
    res.status(500).json({ success: false, message: "Could not delete user" });
  }
};