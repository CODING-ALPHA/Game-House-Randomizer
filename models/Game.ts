import mongoose, { Schema, Model } from "mongoose";

const GroupSchema = new Schema({
  name: { type: String, required: true },
  whatsappLink: { type: String },
  emoji: { type: String },
  colorHex: { type: String, required: true },
  bannerImage: { type: String },
});

const FieldSchema = new Schema({
  name: { type: String, required: true }, // e.g., "Matric Number", "Employee ID"
  type: {
    type: String,
    enum: ["text", "number", "email", "select"],
    default: "text",
  },
  required: { type: Boolean, default: true },
  isUniqueIdentifier: { type: Boolean, default: false }, // If true, this field prevents duplicate registrations
  regexValidation: { type: String }, // e.g., "^BU\\d{2}[A-Z]{3,4}\\d{4}$" - completely optional
  errorMessage: { type: String }, // Custom error if regex fails
  options: [{ type: String }],
});

const GameSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String }, // For dynamic SEO meta tags
  adminPassword: { type: String, required: true, select: false },
  adminEmail: { type: String, lowercase: true, trim: true, index: true },
  assignmentLockToken: { type: String, select: false },
  assignmentLockUntil: { type: Date, select: false },
  themeColor: { type: String, default: "#3B82F6" },
  themeSecondaryColor: { type: String, default: "#D18B48" },
  registrationOpen: { type: Boolean, default: true },
  closedMessage: {
    type: String,
    default: "Registration is currently closed. Please contact the admin.",
  },
  registrationFields: [FieldSchema], // Dynamic fields!
  groups: [GroupSchema],
  createdAt: { type: Date, default: Date.now },
});

export const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);
