import { Document, Schema, Types, model } from "mongoose";
import { Species } from "./report_model";

export enum AgeGroup {
  BABY = "BABY",
  YOUNG = "YOUNG",
  ADULT = "ADULT",
  SENIOR = "SENIOR",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  UNKNOWN = "UNKNOWN",
}

export enum AnimalStatus {
  AVAILABLE = "AVAILABLE",
  PENDING = "PENDING",
  ADOPTED = "ADOPTED",
}

export interface IAnimal extends Document {
  report: Types.ObjectId;
  createdBy: Types.ObjectId;
  adoptedBy?: Types.ObjectId;
  name: string;
  species: Species;
  ageGroup: AgeGroup;
  gender: Gender;
  description?: string;
  healthNotes?: string;
  vaccinated: boolean;
  imageUrl?: string;
  status: AnimalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const animalSchema = new Schema<IAnimal>(
  {
    report: { type: Schema.Types.ObjectId, ref: "Report", required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adoptedBy: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 60 },
    species: { type: String, enum: Object.values(Species), required: true },
    ageGroup: { type: String, enum: Object.values(AgeGroup), required: true },
    gender: { type: String, enum: Object.values(Gender), default: Gender.UNKNOWN },
    description: { type: String, trim: true, maxlength: 1000 },
    healthNotes: { type: String, trim: true, maxlength: 1000 },
    vaccinated: { type: Boolean, default: false },
    imageUrl: { type: String, trim: true },
    status: { type: String, enum: Object.values(AnimalStatus), default: AnimalStatus.AVAILABLE },
  },
  { timestamps: true }
);

animalSchema.index({ species: 1, status: 1, createdAt: -1 });

export const Animal = model<IAnimal>("Animal", animalSchema);