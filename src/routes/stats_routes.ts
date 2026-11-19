import { Router, Request, Response } from "express";
import { Report } from "../models/report_model";
import { Animal, AnimalStatus } from "../models/animal_model";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [saved, rehomed, inCare] = await Promise.all([
      Report.countDocuments(),
      Animal.countDocuments({ status: AnimalStatus.ADOPTED }),
      Animal.countDocuments({
        status: { $in: [AnimalStatus.AVAILABLE, AnimalStatus.PENDING] },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Stats fetched",
      data: {
        saved,
        rehomed,
        inCare,
        fundRaised: 45000,
        fundGoal: 100000,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, message: "Could not load stats" });
  }
});

export default router;