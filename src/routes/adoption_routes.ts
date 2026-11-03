import { Router } from "express";
import {
  cancelAdoption,
  createAdoption,
  decideAdoption,
  getAdoptionById,
  getAdoptions,
} from "../controllers/adoption_controller";
import { authenticate, authorize } from "../middleware/auth_middleware";
import { UserRole } from "../models/user_model";

const router = Router();

router.use(authenticate);

router.post("/", authorize(UserRole.CITIZEN), createAdoption);
router.get("/", authorize(UserRole.CITIZEN, UserRole.ADMIN), getAdoptions);
router.get("/:id", authorize(UserRole.CITIZEN, UserRole.ADMIN), getAdoptionById);
router.put("/:id/cancel", authorize(UserRole.CITIZEN), cancelAdoption);
router.put("/:id/decision", authorize(UserRole.ADMIN), decideAdoption);

export default router;