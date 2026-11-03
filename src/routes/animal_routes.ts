import { Router } from "express";
import {
  createAnimal,
  deleteAnimal,
  getAnimalById,
  getAnimals,
  updateAnimal,
} from "../controllers/animal_controller";
import { authenticate, authorize } from "../middleware/auth_middleware";
import { UserRole } from "../models/user_model";

const router = Router();

// Public
router.get("/", getAnimals);
router.get("/:id", getAnimalById);

// Rescuer or admin
router.post("/", authenticate, authorize(UserRole.RESCUER, UserRole.ADMIN), createAnimal);
router.put("/:id", authenticate, authorize(UserRole.RESCUER, UserRole.ADMIN), updateAnimal);
router.delete("/:id", authenticate, authorize(UserRole.RESCUER, UserRole.ADMIN), deleteAnimal);

export default router;