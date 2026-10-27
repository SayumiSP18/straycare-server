import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth_controller";
import { authenticate } from "../middleware/auth_middleware";

const router = Router();

// Public authentication routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Example of a protected route using your authenticate middleware
router.get("/me", authenticate, (req: any, res: any) => {
  res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    user: req.user, // Contains the token payload (id, role)
  });
});

export default router;