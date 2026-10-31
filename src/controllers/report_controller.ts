import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import {
  AnimalCondition,
  REPORT_TRANSITIONS,
  Report,
  ReportStatus,
  Species,
} from "../models/report.model";
import { UserRole } from "../models/user.model";
import { TokenPayload } from "../utils/jwt";

const createSchema = z.object({
  species: z.enum(Species),
  condition: z.enum(AnimalCondition).optional(),
  location: z.string().trim().min(3, "Location must be at least 3 characters").max(200),
  description: z.string().trim().max(1000).optional(),
  imageUrl: z.url("Image must be a valid URL").optional(),
});
const updateSchema = createSchema.partial();
const statusSchema = z.object({
  status: z.enum([ReportStatus.RESCUED, ReportStatus.IN_CARE]),
});

const currentUser = (req: Request): TokenPayload => req.user as TokenPayload;
const POPULATE = [
  { path: "reporter", select: "name email" },
  { path: "assignedTo", select: "name email" },
];

const validationError = (res: Response, error: z.ZodError): void => {
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues.map((i) => i.message),
  });
};

export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error);
      return;
    }
    const report = await Report.create({ ...parsed.data, reporter: currentUser(req).id });
    res.status(201).json({ success: true, message: "Report created", data: report });
  } catch (error) {
    console.error("CreateReport error:", error);
    res.status(500).json({ success: false, message: "Could not create report" });
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1), 50);

    const filter: Record<string, unknown> = {};
    // Citizens only ever see their own reports
    if (user.role === UserRole.CITIZEN) filter.reporter = user.id;

    const { status, species, condition } = req.query;
    if (typeof status === "string" && Object.values(ReportStatus).includes(status as ReportStatus)) {
      filter.status = status;
    }
    if (typeof species === "string" && Object.values(Species).includes(species as Species)) {
      filter.species = species;
    }
    if (
      typeof condition === "string" &&
      Object.values(AnimalCondition).includes(condition as AnimalCondition)
    ) {
      filter.condition = condition;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(POPULATE),
      Report.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Reports fetched",
      data: reports,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GetReports error:", error);
    res.status(500).json({ success: false, message: "Could not fetch reports" });
  }
};

export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid report id" });
      return;
    }

    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }
    if (user.role === UserRole.CITIZEN && report.reporter.toString() !== user.id) {
      res.status(403).json({ success: false, message: "You can only view your own reports" });
      return;
    }

    await report.populate(POPULATE);
    res.status(200).json({ success: true, message: "Report fetched", data: report });
  } catch (error) {
    console.error("GetReportById error:", error);
    res.status(500).json({ success: false, message: "Could not fetch report" });
  }
};

export const updateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid report id" });
      return;
    }

    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }

    const isOwner = report.reporter.toString() === user.id;
    if (!isOwner && user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "You can only edit your own reports" });
      return;
    }
    if (report.status !== ReportStatus.REPORTED) {
      res.status(400).json({
        success: false,
        message: "A report can only be edited before a rescuer picks it up",
      });
      return;
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error);
      return;
    }

    Object.assign(report, parsed.data);
    await report.save();
    res.status(200).json({ success: true, message: "Report updated", data: report });
  } catch (error) {
    console.error("UpdateReport error:", error);
    res.status(500).json({ success: false, message: "Could not update report" });
  }
};

export const updateReportStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid report id" });
      return;
    }

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error);
      return;
    }
    const newStatus = parsed.data.status;

    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }

    if (!REPORT_TRANSITIONS[report.status].includes(newStatus)) {
      res.status(400).json({
        success: false,
        message: `Cannot change status from ${report.status} to ${newStatus}`,
      });
      return;
    }

    // Once a rescuer has taken a report, only that rescuer (or an admin) can continue it
    if (
      report.assignedTo &&
      report.assignedTo.toString() !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: "This report is assigned to another rescuer",
      });
      return;
    }

    if (newStatus === ReportStatus.RESCUED) {
      report.assignedTo = new mongoose.Types.ObjectId(user.id);
    }
    report.status = newStatus;
    await report.save();

    res.status(200).json({ success: true, message: "Status updated", data: report });
  } catch (error) {
    console.error("UpdateReportStatus error:", error);
    res.status(500).json({ success: false, message: "Could not update status" });
  }
};

export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid report id" });
      return;
    }

    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }

    const isOwner = report.reporter.toString() === user.id;
    if (user.role !== UserRole.ADMIN) {
      if (!isOwner) {
        res.status(403).json({ success: false, message: "You can only delete your own reports" });
        return;
      }
      if (report.status !== ReportStatus.REPORTED) {
        res.status(400).json({
          success: false,
          message: "A report can only be deleted before a rescuer picks it up",
        });
        return;
      }
    }

    await report.deleteOne();
    res.status(200).json({ success: true, message: "Report deleted" });
  } catch (error) {
    console.error("DeleteReport error:", error);
    res.status(500).json({ success: false, message: "Could not delete report" });
  }
};