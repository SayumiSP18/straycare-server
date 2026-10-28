import { Router } from "express";
import { approveUser, deleteUser, getUsers } from "../controllers/user_controller";
import { authenticate, authorize } from "../middleware/auth_middleware";
import { UserRole } from "../models/user_model";

const router = Router();

// Every route below is admin only
router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/", getUsers);
router.put("/:id/approve", approveUser);
router.delete("/:id", deleteUser);

export default router;