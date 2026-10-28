import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { UserRole } from "../models/user_model";

// Checks the access token and attaches the user to the request
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    req.user = verifyAccessToken(header.split(" ")[1]);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Role-based access: authorize(UserRole.ADMIN, UserRole.RESCUER)
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "You do not have permission to do this" });
      return;
    }
    next();
  };