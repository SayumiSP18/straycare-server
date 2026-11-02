import { Document, Schema, Types, model } from "mongoose";

export enum AdoptionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface IAdoption extends Document {
  animal: Types.ObjectId;
  requester: Types.ObjectId;
  message: string;
  phone: string;
  status: AdoptionStatus;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adoptionSchema = new Schema<IAdoption>(
  {
    animal: { type: Schema.Types.ObjectId, ref: "Animal", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    phone: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(AdoptionStatus), default: AdoptionStatus.PENDING },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

// A person can have only ONE pending request per animal
adoptionSchema.index(
  { animal: 1, requester: 1 },
  { unique: true, partialFilterExpression: { status: AdoptionStatus.PENDING } }
);
adoptionSchema.index({ requester: 1, createdAt: -1 });
adoptionSchema.index({ status: 1, createdAt: -1 });

export const AdoptionRequest = model<IAdoption>("AdoptionRequest", adoptionSchema);