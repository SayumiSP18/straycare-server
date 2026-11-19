import { Router } from "express";
import { chatWithBot } from "../controllers/ai_controller";

const router = Router();

router.post("/chat", chatWithBot);

export default router;