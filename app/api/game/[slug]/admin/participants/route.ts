import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";
import Participant from "@/models/Participant";
import { verifyAdminToken } from "@/lib/adminAuth";

async function authorized(slug: string) {
  if (!(await verifyAdminToken(slug))) return null;
  await connectDB();
  return Game.findOne({ slug }).select("groups");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const game = await authorized((await params).slug);
    if (!game)
      return NextResponse.json(
        { error: "Unauthorized or event not found." },
        { status: 401 },
      );
    const participants = await Participant.find({ gameId: game._id })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({ participants });
  } catch {
    return NextResponse.json(
      { error: "We couldn’t load participants. Please try again." },
      { status: 503 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const game = await authorized((await params).slug);
    if (!game)
      return NextResponse.json(
        { error: "Unauthorized or event not found." },
        { status: 401 },
      );
    const body = await request.json();
    if (
      !body ||
      typeof body.name !== "string" ||
      typeof body.identifier !== "string" ||
      typeof body.groupName !== "string"
    )
      return NextResponse.json(
        { error: "Please enter a name, email, and team." },
        { status: 400 },
      );
    const name = body.name.trim();
    const identifier = body.identifier.trim().toLowerCase();
    const groupName = body.groupName.trim();
    if (
      !name ||
      name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) ||
      !game.groups.some((group: { name: string }) => group.name === groupName)
    )
      return NextResponse.json(
        { error: "Use a name, valid email, and existing team." },
        { status: 400 },
      );
    const existing = await Participant.exists({
      gameId: game._id,
      uniqueIdentifier: identifier,
    });
    if (existing)
      return NextResponse.json(
        { error: "That email already belongs to a participant." },
        { status: 409 },
      );
    const participant = await Participant.create({
      gameId: game._id,
      name,
      uniqueIdentifier: identifier,
      data: { "Full Name": name, "Email Address": identifier },
      groupName,
    });
    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      return NextResponse.json(
        { error: "That email already belongs to a participant." },
        { status: 409 },
      );
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Please check the participant details."
            : "We couldn’t add that participant. Please try again.",
      },
      { status: error instanceof SyntaxError ? 400 : 503 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const game = await authorized((await params).slug);
    if (!game)
      return NextResponse.json(
        { error: "Unauthorized or event not found." },
        { status: 401 },
      );
    const body = await request.json();
    if (
      !body ||
      !isValidObjectId(body.id) ||
      typeof body.name !== "string" ||
      typeof body.groupName !== "string"
    ) {
      return NextResponse.json(
        { error: "Please check the participant details." },
        { status: 400 },
      );
    }
    const name = body.name.trim();
    const groupName = body.groupName.trim();
    if (
      !name ||
      name.length > 100 ||
      !game.groups.some((group: { name: string }) => group.name === groupName)
    ) {
      return NextResponse.json(
        { error: "Use a name and an existing team." },
        { status: 400 },
      );
    }
    const participant = await Participant.findOneAndUpdate(
      { _id: body.id, gameId: game._id },
      { $set: { name, groupName } },
      { new: true },
    ).lean();
    if (!participant)
      return NextResponse.json(
        { error: "Participant not found." },
        { status: 404 },
      );
    return NextResponse.json({ participant });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Please check the participant details."
            : "We couldn’t save that participant. Please try again.",
      },
      { status: error instanceof SyntaxError ? 400 : 503 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const game = await authorized((await params).slug);
    if (!game)
      return NextResponse.json(
        { error: "Unauthorized or event not found." },
        { status: 401 },
      );
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !isValidObjectId(id))
      return NextResponse.json(
        { error: "Choose a valid participant." },
        { status: 400 },
      );
    const deleted = await Participant.findOneAndDelete({
      _id: id,
      gameId: game._id,
    });
    if (!deleted)
      return NextResponse.json(
        { error: "Participant not found." },
        { status: 404 },
      );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "We couldn’t remove that participant. Please try again." },
      { status: 503 },
    );
  }
}
