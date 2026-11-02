import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { AdoptionRequest } from "../models/adoption_model";
import { AgeGroup, Animal, AnimalStatus, Gender } from "../models/animal_model";
import { Report, ReportStatus, Species } from "../models/report_model";
import { UserRole } from "../models/user_model";
import { TokenPayload } from "../utils/jwt";

const profileFields = {
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  ageGroup: z.enum(AgeGroup),
  gender: z.enum(Gender).optional(),
  description: z.string().trim().max(1000).optional(),
  healthNotes: z.string().trim().max(1000).optional(),
  vaccinated: z.boolean().optional(),
  imageUrl: z.url("Image must be a valid URL").optional(),
};
const createSchema = z.object({ reportId: z.string().min(1, "Report id is required"), ...profileFields });
const updateSchema = z.object(profileFields).partial();

const currentUser = (req: Request): TokenPayload => req.user as TokenPayload;
const inEnum = (e: object, v: unknown): boolean =>
  typeof v === "string" && (Object.values(e) as string[]).includes(v);

const validationError = (res: Response, error: z.ZodError): void => {
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues.map((i) => i.message),
  });
};

export const createAnimal = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error);
      return;
    }
    const { reportId, ...profile } = parsed.data;
    if (!mongoose.isValidObjectId(reportId)) {
      res.status(400).json({ success: false, message: "Invalid report id" });
      return;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }
    if (report.status !== ReportStatus.RESCUED && report.status !== ReportStatus.IN_CARE) {
      res.status(400).json({ success: false, message: "The report must be rescued first" });
      return;
    }
    if (user.role === UserRole.RESCUER && report.assignedTo?.toString() !== user.id) {
      res.status(403).json({ success: false, message: "You can only create profiles for reports you rescued" });
      return;
    }
    if (await Animal.exists({ report: report._id })) {
      res.status(409).json({ success: false, message: "This report already has an animal profile" });
      return;
    }

    const animal = await Animal.create({
      ...profile,
      report: report._id,
      species: report.species,
      createdBy: user.id,
      imageUrl: profile.imageUrl ?? report.imageUrl,
    });
    res.status(201).json({ success: true, message: "Animal profile created", data: animal });
  } catch (error) {
    console.error("CreateAnimal error:", error);
    res.status(500).json({ success: false, message: "Could not create animal" });
  }
};

// Public: used by the Adopt page
export const getAnimals = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "9"), 10) || 9, 1), 50);
    const { species, ageGroup, gender, status } = req.query;

    const filter: Record<string, unknown> = {};
    if (inEnum(Species, species)) filter.species = species;
    if (inEnum(AgeGroup, ageGroup)) filter.ageGroup = ageGroup;
    if (inEnum(Gender, gender)) filter.gender = gender;
    filter.status = inEnum(AnimalStatus, status)
      ? status
      : { $in: [AnimalStatus.AVAILABLE, AnimalStatus.PENDING] };

    const [animals, total] = await Promise.all([
      Animal.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Animal.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Animals fetched",
      data: animals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GetAnimals error:", error);
    res.status(500).json({ success: false, message: "Could not fetch animals" });
  }
};

export const getAnimalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid animal id" });
      return;
    }
    const animal = await Animal.findById(id).populate("createdBy", "name");
    if (!animal) {
      res.status(404).json({ success: false, message: "Animal not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Animal fetched", data: animal });
  } catch (error) {
    console.error("GetAnimalById error:", error);
    res.status(500).json({ success: false, message: "Could not fetch animal" });
  }
};

export const updateAnimal = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid animal id" });
      return;
    }
    const animal = await Animal.findById(id);
    if (!animal) {
      res.status(404).json({ success: false, message: "Animal not found" });
      return;
    }
    if (animal.createdBy.toString() !== user.id && user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "You can only edit animals you created" });
      return;
    }
    if (animal.status === AnimalStatus.ADOPTED) {
      res.status(400).json({ success: false, message: "An adopted animal cannot be edited" });
      return;
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error);
      return;
    }
    Object.assign(animal, parsed.data);
    await animal.save();
    res.status(200).json({ success: true, message: "Animal updated", data: animal });
  } catch (error) {
    console.error("UpdateAnimal error:", error);
    res.status(500).json({ success: false, message: "Could not update animal" });
  }
};

export const deleteAnimal = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = currentUser(req);
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid animal id" });
      return;
    }
    const animal = await Animal.findById(id);
    if (!animal) {
      res.status(404).json({ success: false, message: "Animal not found" });
      return;
    }
    if (animal.createdBy.toString() !== user.id && user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "You can only delete animals you created" });
      return;
    }
    if (animal.status === AnimalStatus.ADOPTED) {
      res.status(400).json({ success: false, message: "An adopted animal cannot be deleted" });
      return;
    }

    await AdoptionRequest.deleteMany({ animal: animal._id });
    await animal.deleteOne();
    res.status(200).json({ success: true, message: "Animal deleted" });
  } catch (error) {
    console.error("DeleteAnimal error:", error);
    res.status(500).json({ success: false, message: "Could not delete animal" });
  }
};