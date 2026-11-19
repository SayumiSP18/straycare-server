// import { Request, Response } from "express";
// import { runFollowUps } from "../jobs/followUpJob";

// export const triggerFollowUps = async (req: Request, res: Response) => {
//   if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
//     return res.status(401).json({ success: false, message: "Unauthorized" });
//   }
//   const sent = await runFollowUps();
//   res.status(200).json({ success: true, sent });
// };
