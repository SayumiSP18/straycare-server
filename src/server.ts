// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";

// dotenv.config();
// const app = express();

// app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
// app.use(express.json());

// app.get("/api/health", (_req, res) => {
//   res.json({ success: true, message: "StrayCare API running" });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));










// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import dns from 'node:dns';
// dns.setServers(['8.8.8.8', '8.8.4.4']);
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import dotenv from "dotenv";
// import { connectDB } from "./config/db";
// import authRoutes from "./routes/auth_routes";
// import { errorHandler, notFound } from "./middleware/error_middleware";
// import userRoutes from "./routes/user_routes";
// import reportRoutes from "./routes/report_routes";
// import animalRoutes from "./routes/animal_routes";
// import adoptionRoutes from "./routes/adoption_routes";

// dotenv.config();
// const app = express();


// app.set("trust proxy", 1); // needed on Render so secure cookies and client IPs work
// app.use(helmet());

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   limit: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { success: false, message: "Too many requests, please try again later" },
// });


// app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
// app.use(express.json());
// app.use(cookieParser());

// app.get("/api/health", (_req, res) => {
//   res.json({ success: true, message: "StrayCare API running" });
// });

// app.use("/api/v1/auth", authLimiter, authRoutes);
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/reports", reportRoutes);
// app.use("/api/v1/animals", animalRoutes);
// app.use("/api/v1/adoptions", adoptionRoutes);

// app.use(notFound);
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;

// connectDB()
//   .then(() => {
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch((err: Error) => {
//     console.error("Failed to connect to MongoDB:", err.message);
//     process.exit(1);
//   });

  





import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth_routes";
import { errorHandler, notFound } from "./middleware/error_middleware";
import userRoutes from "./routes/user_routes";
import reportRoutes from "./routes/report_routes";
import animalRoutes from "./routes/animal_routes";
import adoptionRoutes from "./routes/adoption_routes";

dotenv.config();
const app = express();

app.set("trust proxy", 1); // needed on Render/Railway so secure cookies and client IPs work

// Allow cross-origin image loading so the frontend client can display uploads from the backend server
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Ensure public/uploads directory exists automatically on startup
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "StrayCare API running" });
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/animals", animalRoutes);
app.use("/api/v1/adoptions", adoptionRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err: Error) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });