import mongoose, { Schema, Model } from "mongoose";
import { HouseType } from "@/config/houses";

export interface IStudent {
  name: string;
  level: string;
  department: string;
  matricNumber?: string;
  email?: string;
  phoneNumber?: string;
  sportsEvents?: string[];
  medicalConsiderations?: string;
  suggestions?: string;
  house: HouseType;
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  name: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  matricNumber: {
    type: String,
    required: false,
    default: null,
    validate: {
      validator: function (matric: any): boolean {
        if (!matric || typeof matric !== "string" || matric.trim() === "") {
          return true;
        }
        const matricRegex = /^BU\d{2}[A-Z]{3,5}\d{4}$/i;
        return Boolean(matricRegex.test(matric.trim()));
      },
      message: "Invalid matric number format. Example: BU22COCS1068",
    },
  },
  email: {
    type: String,
    required: false,
    trim: true,
    default: "",
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    default: "",
  },
  sportsEvents: {
    type: [String],
    default: [],
  },
  medicalConsiderations: {
    type: String,
    default: "",
  },
  suggestions: {
    type: String,
    default: "",
  },
  house: {
    type: String,
    enum: [
      "jael",
      "abigail",
      "esther",
      "deborah",
      "priscilla",
    ],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for duplicate prevention
StudentSchema.index({ name: 1, level: 1, department: 1 }, { unique: true });

// ADD THIS INDEX for matric number uniqueness (only when provided)
StudentSchema.index(
  { matricNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { matricNumber: { $type: "string" } },
  }
);

// Reset cached model in development to ensure new schema/enums are immediately active
if (mongoose.models && mongoose.models.Student) {
  delete (mongoose.models as any).Student;
}

const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;