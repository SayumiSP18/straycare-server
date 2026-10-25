import { CookieOptions, Request, Response } from "express";
import { z } from "zod";
import { User, UserRole } from "../models/user_model";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CITIZEN", "RESCUER"]).optional(), // ADMIN can never self-register
});

const loginSchema = z.object({
  email: z.email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});

const REFRESH_COOKIE = "refreshToken";
const MAX_SESSIONS = 5;

const cookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true, // JavaScript in the browser cannot read it
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/v1/auth",
  };
};

const publicUser = (user: InstanceType<typeof User>) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isApproved: user.isApproved,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { name, email, password } = parsed.data;
    const role = parsed.data.role === "RESCUER" ? UserRole.RESCUER : UserRole.CITIZEN;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(409).json({ success: false, message: "Email is already registered" });
      return;
    }

    const user = await User.create({
      name,
      email,
      password, // hashed by the pre-save hook in the model
      role,
      isApproved: role !== UserRole.RESCUER, // rescuers wait for admin approval
    });

    res.status(201).json({
      success: true,
      message: user.isApproved
        ? "Registration successful"
        : "Registration successful. Your rescuer account is waiting for admin approval.",
      data: publicUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +refreshTokens"
    );

    // Same message for both cases so attackers cannot tell which was wrong
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    if (!user.isApproved) {
      res.status(403).json({
        success: false,
        message: "Your account is waiting for admin approval",
      });
      return;
    }

    const payload = { id: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokens = [...user.refreshTokens.slice(-(MAX_SESSIONS - 1)), refreshToken];
    await user.save();

    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { accessToken, user: publicUser(user) },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json({ success: false, message: "No refresh token" });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
      return;
    }

    const user = await User.findById(payload.id).select("+refreshTokens");
    // Token must still be stored, otherwise it was revoked (logged out)
    if (!user || !user.refreshTokens.includes(token)) {
      res.status(401).json({ success: false, message: "Refresh token revoked" });
      return;
    }

    if (!user.isApproved) {
      res.status(403).json({ success: false, message: "Account not approved" });
      return;
    }

    const newPayload = { id: user.id, role: user.role };
    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    // Rotation: the old token is replaced, so it can only be used once
    user.refreshTokens = [...user.refreshTokens.filter((t) => t !== token), newRefreshToken].slice(
      -MAX_SESSIONS
    );
    await user.save();

    res.cookie(REFRESH_COOKIE, newRefreshToken, {
      ...cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { accessToken },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ success: false, message: "Could not refresh token" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await User.updateOne({ _id: payload.id }, { $pull: { refreshTokens: token } });
      } catch {
        // expired or invalid token: nothing to revoke
      }
    }
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};