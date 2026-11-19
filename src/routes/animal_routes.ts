import { Router } from "express";
import {
  createAnimal,
  deleteAnimal,
  getAnimalById,
  getAnimals,
  updateAnimal,
} from "../controllers/animal_controller";
import { authenticate, authorize } from "../middleware/auth_middleware";
import { upload } from "../middleware/upload_middleware"; // Added multer upload middleware
import { UserRole } from "../models/user_model";

const router = Router();

// Public routes (Anyone viewing the web app can see them)
router.get("/", getAnimals);
router.get("/:id", getAnimalById);

// Rescuer or admin routes (With image upload support)
router.post(
  "/", 
  authenticate, 
  authorize(UserRole.RESCUER, UserRole.ADMIN), 
  upload.single("photo"), 
  createAnimal
);

router.put(
  "/:id", 
  authenticate, 
  authorize(UserRole.RESCUER, UserRole.ADMIN), 
  upload.single("photo"), 
  updateAnimal
);

router.delete(
  "/:id", 
  authenticate, 
  authorize(UserRole.RESCUER, UserRole.ADMIN), 
  deleteAnimal
);

export default router;