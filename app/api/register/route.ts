import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";
import { assignHouse } from "@/lib/houseAssignment";
import { REGISTRATION_CONFIG } from "@/config/registration";

export const VALID_COLLEGES = [
  "COAES",
  "COMSS",
  "COCS",
  "COHES",
  "COLAW",
  "COEVS",
  "COLBS",
] as const;

function validateMatricNumber(
  level: string,
  college: string,
  matricNumber?: string
): string | null {
  const trimmedLevel = typeof level === "string" ? level.trim() : "";
  const trimmedCollege = typeof college === "string" ? college.trim().toUpperCase() : "";
  const normalizedMatric = matricNumber?.trim() ?? "";

  // For level 100, matric number is optional
  if (trimmedLevel === "100" && normalizedMatric === "") {
    return null; // No error
  }

  // For levels above 100, matric number is required
  if (trimmedLevel !== "100" && normalizedMatric === "") {
    return "Matric number is required";
  }

  if (normalizedMatric === "") {
    return null;
  }

  // Accepts standard Bowen matric format: BU + 2 digits + 3-5 letters + 4 digits
  const matricRegex = /^BU\d{2}[A-Z]{3,5}\d{4}$/;
  if (!matricRegex.test(normalizedMatric.toUpperCase())) {
    return `Invalid matric number format. Example: BU22${trimmedCollege || "COCS"}1068`;
  }

  return null; // No error
}

// ADD THIS FUNCTION TO CHECK FOR EXISTING MATRIC NUMBER
async function checkExistingMatricNumber(matricNumber: string): Promise<boolean> {
  if (!matricNumber || matricNumber.trim() === "") return false;
  
  const formattedMatricNumber = matricNumber.trim().toUpperCase();
  const existingStudent = await Student.findOne({
    matricNumber: formattedMatricNumber
  });
  
  return !!existingStudent;
}

export async function POST(request: NextRequest) {
  // Check if registration is locked
  if (!REGISTRATION_CONFIG.REGISTRATION_OPEN) {
    return NextResponse.json(
      { error: REGISTRATION_CONFIG.CLOSED_MESSAGE },
      { status: 403 }
    );
  }

  let safeName = "";
  let safeLevel = "";
  let safeDepartment = "";

  try {
    await connectDB();

    const {
      name,
      level,
      department,
      matricNumber,
      email,
      phoneNumber,
      sportsEvents,
      medicalConsiderations,
      suggestions,
    } = await request.json();

    // Defensive assignments
    safeName = typeof name === "string" ? name : "";
    safeLevel = typeof level === "string" ? level : "";
    safeDepartment = typeof department === "string" ? department : "";
    const safeEmail = typeof email === "string" ? email.trim() : "";
    const safePhoneNumber = typeof phoneNumber === "string" ? phoneNumber.trim() : "";
    const safeSportsEvents = Array.isArray(sportsEvents)
      ? sportsEvents.filter((e) => typeof e === "string")
      : [];
    const safeMedical = typeof medicalConsiderations === "string" ? medicalConsiderations.trim() : "";
    const safeSuggestions = typeof suggestions === "string" ? suggestions.trim() : "";

    if (!safeName || !safeLevel || !safeDepartment) {
      return NextResponse.json(
        { error: "Name, level, and college are required" },
        { status: 400 }
      );
    }

    if (!safeEmail) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    if (!safePhoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // ADD MATRIC NUMBER VALIDATION
    const normalizedMatricNumber =
      typeof matricNumber === "string" ? matricNumber.trim().toUpperCase() : "";

    const matricValidationError = validateMatricNumber(
      safeLevel,
      safeDepartment,
      normalizedMatricNumber || undefined
    );
    if (matricValidationError) {
      return NextResponse.json(
        { error: matricValidationError },
        { status: 400 }
      );
    }

    // ADD DUPLICATE MATRIC NUMBER CHECK (only if matric number is provided)
    if (normalizedMatricNumber !== "") {
      const matricExists = await checkExistingMatricNumber(normalizedMatricNumber);
      if (matricExists) {
        return NextResponse.json(
          { error: "Matric number already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate submission (existing logic)
    const existingStudent = await Student.findOne({
      name: safeName.trim(),
      level: safeLevel.trim(),
      department: safeDepartment.trim(),
    });

    if (existingStudent) {
      return NextResponse.json({
        message: "Student already registered",
        student: existingStudent,
      });
    }

    // Assign house using balanced randomization
    const house = await assignHouse();

    const studentData: Record<string, any> = {
      name: safeName.trim(),
      level: safeLevel.trim(),
      department: safeDepartment.trim(),
      house,
      email: safeEmail,
      phoneNumber: safePhoneNumber,
      sportsEvents: safeSportsEvents,
      medicalConsiderations: safeMedical,
      suggestions: safeSuggestions,
    };

    if (normalizedMatricNumber !== "") {
      studentData.matricNumber = normalizedMatricNumber;
    }

    const student = await Student.create(studentData);

    return NextResponse.json({
      message: "Student registered successfully",
      student,
    });
  } catch (error: any) {
    // Handle duplicate key error (updated for matric number)
    if (error.code === 11000) {
      // Check if it's a matric number duplicate error
      if (error.keyPattern && error.keyPattern.matricNumber) {
        return NextResponse.json(
          { error: "Matric number already registered" },
          { status: 400 }
        );
      }
      
      // Handle the existing name/level/department duplicate
      const keyValue = error.keyValue || {};
      const existingStudent = await Student.findOne({
        name: keyValue.name || safeName.trim(),
        level: keyValue.level || safeLevel.trim(),
        department: keyValue.department || safeDepartment.trim(),
      });

      if (existingStudent) {
        return NextResponse.json({
          message: "Student already registered",
          student: existingStudent,
        });
      }
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register student" },
      { status: 400 }
    );
  }
}