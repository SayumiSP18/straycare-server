import { Document, Schema, Types, model } from "mongoose";

export enum Species {
  DOG = "DOG",
  CAT = "CAT",
}

export enum AnimalCondition {
  HEALTHY = "HEALTHY",
  INJURED = "INJURED",
  URGENT = "URGENT",
}

export enum ReportStatus {
  REPORTED = "REPORTED",
  RESCUED = "RESCUED",
  IN_CARE = "IN_CARE",
  ADOPTED = "ADOPTED",
}

// Allowed status changes. ADOPTED is set by the adoption feature, not here.
export const REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.REPORTED]: [ReportStatus.RESCUED],
  [ReportStatus.RESCUED]: [ReportStatus.IN_CARE],
  [ReportStatus.IN_CARE]: [],
  [ReportStatus.ADOPTED]: [],
};

export interface IReport extends Document {
  reporter: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  species: Species;
  condition: AnimalCondition;
  location: string;
  description?: string;
  imageUrl?: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    species: { type: String, enum: Object.values(Species), required: true },
    condition: {
      type: String,
      enum: Object.values(AnimalCondition),
      default: AnimalCondition.HEALTHY,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: { type: String, trim: true, maxlength: 1000 },
    imageUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.REPORTED,
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, createdAt: -1 });

export const Report = model<IReport>("Report", reportSchema);