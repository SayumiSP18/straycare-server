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
import { UserRole } from "../models/user_model";

const router = Router();

router.use(authenticate); // every report route needs a login

router.post("/", createReport);
router.get("/", getReports);
router.get("/:id", getReportById);
router.put("/:id", updateReport);
router.put("/:id/status", authorize(UserRole.RESCUER, UserRole.ADMIN), updateReportStatus);
router.delete("/:id", deleteReport);

export default router;