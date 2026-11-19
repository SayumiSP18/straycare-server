// import cron from "node-cron";
// import Adoption from "../models/Adoption";
// import { sendEmail } from "../services/emailService";
// import { templates } from "../utils/emailTemplates";

// export const FOLLOW_UP_INTERVAL_DAYS = 14;
// export const FOLLOW_UP_MONTHS = 6;

// export const runFollowUps = async (): Promise<number> => {
//   const now = new Date();
//   const due = await Adoption.find({
//     status: "APPROVED",
//     nextCheckInDue: { $lte: now },
//     followUpEndsAt: { $gte: now },
//   })
//     .populate("adopter", "name email emailNotifications")
//     .populate("animal", "name");

//   let sent = 0;
//   for (const a of due as any[]) {
//     if (a.adopter?.emailNotifications === false) continue;

//     const ok = await sendEmail({
//       to: a.adopter.email,
//       subject: "StrayCare: time for a welfare check-in",
//       html: templates.followUpReminder(a.adopter.name, a.animal.name, a._id.toString()),
//     });

//     if (ok) {
//       a.lastReminderSentAt = now;
//       a.nextCheckInDue = new Date(now.getTime() + FOLLOW_UP_INTERVAL_DAYS * 86400000);
//       await a.save();
//       sent++;
//     }
//   }
//   return sent;
// };

// // Works when the server is awake (local / paid hosting)
// export const startFollowUpJob = () => {
//   cron.schedule("0 9 * * *", async () => {
//     const n = await runFollowUps();
//     console.log(`Follow-up reminders sent: ${n}`);
//   });
// };