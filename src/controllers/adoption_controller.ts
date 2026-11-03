import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { AdoptionRequest, AdoptionStatus } from "../models/adoption_model";
import { Animal, AnimalStatus } from "../models/animal_model";
import { Report, ReportStatus } from "../models/report_model";
import { UserRole } from "../models/user_model";
import { TokenPayload } from "../utils/jwt";

const createSchema = z.object({
  animalId: z.string().min(1, "Animal id is required"),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us about yourself (at least 10 characters)")
    .max(1000),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, "Please provide a valid phone number"),
});
const decisionSchema = z.object({
  decision: z.enum([AdoptionStatus.APPROVED, AdoptionStatus.REJECTED]),
});

const currentUser = (req: Request): TokenPayload => req.user as TokenPayload;
const POPULATE = [
  { path: "animal", select: "name species imageUrl status" },
  { path: "requester", select: "name email" },
];

const validationError = (res: Response, error: z.ZodError): void => {
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues.map((i) => i.message),
  });
};

// If nobody is waiting for the animal any more, make it available again
const releaseAnimalIfNoPending = async (animalId: Types.ObjectId): Promise<void> => {
  const remaining = await AdoptionRequest.countDocuments({
    animal: animalId,
    status: AdoptionStatus.PENDING,
  });
  if (remaining === 0) {
    await Animal.updateOne(
      { _id: animalId, status: AnimalStatus.PENDING },
      { status: AnimalStatus.AVAILABLE }
    );
  }
};

export const createAdoption = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error);
      return;
    }
    const { animalId, message, phone } = parsed.data;
    if (!mongoose.isValidObjectId(animalId)) {
      res.status(400).json({ success: false, message: "Invalid animal id" });
      return;
    }

    const animal = await Animal.findById(animalId);
    if (!animal) {
      res.status(404).json({ success: false, message: "Animal not found" });
      return;
    }
    if (animal.status === AnimalStatus.ADOPTED) {
      res.status(400).json({ success: false, message: "This animal has already been adopted" });
      return;
    }
    const duplicate = await AdoptionRequest.exists({
      animal: animal._id,
      requester: user.id,
      status: AdoptionStatus.PENDING,
    });
    if (duplicate) {
      res.status(409).json({ success: false, message: "You already have a pending request for this animal" });
      return;
    }

    const request = await AdoptionRequest.create({
      animal: animal._id,
      requester: user.id,
      message,
      phone,
    });
    if (animal.status === AnimalStatus.AVAILABLE) {
      animal.status = AnimalStatus.PENDING;
      await animal.save();
    }
    res.status(201).json({ success: true, message: "Adoption request submitted", data: request });
  } catch (error) {
    // Duplicate key from the partial unique index (two clicks at once)
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ success: false, message: "You already have a pending request for this animal" });
      return;
    }
    console.error("CreateAdoption error:", error);
    res.status(500).json({ success: false, message: "Could not submit request" });
  }
};

export const getAdoptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1), 50);

    const filter: Record<string, unknown> = {};
    if (user.role === UserRole.CITIZEN) filter.requester = user.id;
    const { status } = req.query;
    if (typeof status === "string" && (Object.values(AdoptionStatus) as string[]).includes(status)) {
      filter.status = status;
    }

    const [requests, total] = await Promise.all([
      AdoptionRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(POPULATE),
      AdoptionRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Adoption requests fetched",
      data: requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GetAdoptions error:", error);
    res.status(500).json({ success: false, message: "Could not fetch requests" });
  }
};

export const getAdoptionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid request id" });
      return;
    }
    const request = await AdoptionRequest.findById(id);
    if (!request) {
      res.status(404).json({ success: false, message: "Adoption request not found" });
      return;
    }
    if (user.role !== UserRole.ADMIN && request.requester.toString() !== user.id) {
      res.status(403).json({ success: false, message: "You can only view your own requests" });
      return;
    }
    await request.populate(POPULATE);
    res.status(200).json({ success: true, message: "Adoption request fetched", data: request });
  } catch (error) {
    console.error("GetAdoptionById error:", error);
    res.status(500).json({ success: false, message: "Could not fetch request" });
  }
};

export const cancelAdoption = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid request id" });
      return;
    }
    const request = await AdoptionRequest.findById(id);
    if (!request) {
      res.status(404).json({ success: false, message: "Adoption request not found" });
      return;
    }
    if (request.requester.toString() !== user.id) {
      res.status(403).json({ success: false, message: "You can only cancel your own requests" });
      return;
    }
    if (request.status !== AdoptionStatus.PENDING) {
      res.status(400).json({ success: false, message: "Only pending requests can be cancelled" });
      return;
    }

    request.status = AdoptionStatus.CANCELLED;
    await request.save();
    await releaseAnimalIfNoPending(request.animal);
    res.status(200).json({ success: true, message: "Request cancelled", data: request });
  } catch (error) {
    console.error("CancelAdoption error:", error);
    res.status(500).json({ success: false, message: "Could not cancel request" });
  }
};

export const decideAdoption = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid request id" });
      return;
    }
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error);
      return;
    }

    const request = await AdoptionRequest.findById(id);
    if (!request) {
      res.status(404).json({ success: false, message: "Adoption request not found" });
      return;
    }
    if (request.status !== AdoptionStatus.PENDING) {
      res.status(400).json({ success: false, message: "This request has already been decided" });
      return;
    }
    const animal = await Animal.findById(request.animal);
    if (!animal) {
      res.status(404).json({ success: false, message: "Animal no longer exists" });
      return;
    }

    const adminId = new Types.ObjectId(user.id);
    request.status = parsed.data.decision;
    request.decidedBy = adminId;
    request.decidedAt = new Date();

    if (parsed.data.decision === AdoptionStatus.APPROVED) {
      if (animal.status === AnimalStatus.ADOPTED) {
        res.status(400).json({ success: false, message: "This animal has already been adopted" });
        return;
      }
      await request.save();
      animal.status = AnimalStatus.ADOPTED;
      animal.adoptedBy = request.requester;
      await animal.save();
      await Report.updateOne({ _id: animal.report }, { status: ReportStatus.ADOPTED });
      // Everyone else waiting for this animal is rejected
      await AdoptionRequest.updateMany(
        { animal: animal._id, _id: { $ne: request._id }, status: AdoptionStatus.PENDING },
        { status: AdoptionStatus.REJECTED, decidedBy: adminId, decidedAt: new Date() }
      );
    } else {
      await request.save();
      await releaseAnimalIfNoPending(animal._id as Types.ObjectId);
    }

    res.status(200).json({ success: true, message: `Request ${request.status.toLowerCase()}`, data: request });
  } catch (error) {
    console.error("DecideAdoption error:", error);
    res.status(500).json({ success: false, message: "Could not save decision" });
  }
};