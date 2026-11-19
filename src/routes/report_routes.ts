import { Router } from "express";
import {
  createReport,
  deleteReport,
  getReportById,
  getReports,
  updateReport,
  updateReportStatus,
} from "../controllers/report_controller";
import { authenticate, authorize } from "../middleware/auth_middleware";
import { upload } from "../middleware/upload_middleware";
import { UserRole } from "../models/user_model";

const router = Router();

router.use(authenticate); 

router.post("/", upload.single("photo"), createReport);
router.get("/", getReports);
router.get("/:id", getReportById);
router.put("/:id", upload.single("photo"), updateReport);
router.put("/:id/status", authorize(UserRole.RESCUER, UserRole.ADMIN), updateReportStatus);
router.delete("/:id", deleteReport);

export default router;