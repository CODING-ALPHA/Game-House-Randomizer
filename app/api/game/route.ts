import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";
import {
  hashPassword,
  setAdminToken,
  setOrganizerSession,
} from "@/lib/adminAuth";
import { validateEvent } from "@/lib/validation";
import type { Group } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (
      !data ||
      ["name", "slug", "adminPassword", "adminEmail"].some(
        (key) => typeof data[key] !== "string",
      ) ||
      !Array.isArray(data.groups) ||
      data.groups.some(
        (group: Group) =>
          !group ||
          typeof group.name !== "string" ||
          typeof group.colorHex !== "string" ||
          (group.emoji != null && typeof group.emoji !== "string") ||
          (group.whatsappLink != null &&
            typeof group.whatsappLink !== "string"),
      ) ||
      (data.description != null && typeof data.description !== "string") ||
      (data.themeColor != null && typeof data.themeColor !== "string") ||
      (data.themeSecondaryColor != null &&
        typeof data.themeSecondaryColor !== "string")
    ) {
      return NextResponse.json(
        { error: "Please check your event details and team names." },
        { status: 400 },
      );
    }
    const normalized = {
      ...data,
      name: data.name.trim(),
      adminEmail: data.adminEmail.trim().toLowerCase(),
      slug: data.slug.trim().toLowerCase(),
      themeColor: data.themeColor || "#557445",
      themeSecondaryColor: data.themeSecondaryColor || "#D18B48",
    };
    const errors = validateEvent(normalized);
    if (Object.keys(errors).length)
      return NextResponse.json(
        { error: Object.values(errors)[0], fields: errors },
        { status: 400 },
      );
    // The creation form collects these two fields; email prevents duplicate entries.
    const registrationFields = [
      {
        name: "Full Name",
        type: "text",
        required: true,
        isUniqueIdentifier: false,
      },
      {
        name: "Email Address",
        type: "email",
        required: true,
        isUniqueIdentifier: true,
      },
    ];
    await connectDB();
    const existing = await Game.exists({ slug: normalized.slug });
    if (existing)
      return NextResponse.json(
        {
          error: "That event link is already taken. Choose another one.",
          fields: { slug: "This link is already taken." },
        },
        { status: 409 },
      );
    const game = await Game.create({
      name: normalized.name,
      slug: normalized.slug,
      description:
        data.description?.trim() ||
        `Join ${normalized.name} and discover your team.`,
      adminPassword: await hashPassword(data.adminPassword),
      adminEmail: normalized.adminEmail,
      themeColor: normalized.themeColor,
      themeSecondaryColor: normalized.themeSecondaryColor,
      registrationOpen: true,
      registrationFields,
      groups: data.groups.map((group: Group) => ({
        name: group.name.trim(),
        colorHex: group.colorHex,
        emoji: group.emoji?.trim() || "",
        whatsappLink: group.whatsappLink?.trim() || "",
      })),
    });
    await setAdminToken(game.slug, game.adminPassword);
    await setOrganizerSession(game.adminPassword);
    return NextResponse.json(
      { success: true, slug: game.slug },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { error: "The event details couldn’t be read. Please try again." },
        { status: 400 },
      );
    if ((error as { code?: number }).code === 11000)
      return NextResponse.json(
        { error: "That event link is already taken. Choose another one." },
        { status: 409 },
      );
    console.error("Event creation failed:", error);
    return NextResponse.json(
      {
        error:
          "We couldn’t create your event right now. Your details are still here; please try again.",
      },
      { status: 503 },
    );
  }
}
