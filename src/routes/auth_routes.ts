import { Router } from "express";
import { getMe, login, logout, refresh, register } from "../controllers/auth_controller";
import { authenticate, authorize } from "../middleware/auth_middleware";
import { UserRole } from "../models/user_model";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

// TEMPORARY: only for testing role-based access, delete it later
router.get("/admin-test", authenticate, authorize(UserRole.ADMIN), (_req, res) => {
  res.status(200).json({ success: true, message: "Admin access granted" });
});

export default router;