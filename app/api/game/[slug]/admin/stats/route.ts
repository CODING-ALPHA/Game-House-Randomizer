import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";
import Participant from "@/models/Participant";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!(await verifyAdminToken(slug))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const game = await Game.findOne({ slug }).select("-adminPassword");

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const totalParticipants = await Participant.countDocuments({
      gameId: game._id,
    });

    const groupCounts = await Participant.aggregate([
      { $match: { gameId: game._id } },
      { $group: { _id: "$groupName", count: { $sum: 1 } } },
    ]);

    return NextResponse.json({ game, totalParticipants, groupCounts });
  } catch {
    return NextResponse.json(
      { error: "We couldn’t load your dashboard. Please try again." },
      { status: 503 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!(await verifyAdminToken(slug))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();
    if (!data || typeof data.registrationOpen !== "boolean") {
      return NextResponse.json(
        { error: "Choose whether registration should be open or closed." },
        { status: 400 },
      );
    }

    const game = await Game.findOneAndUpdate(
      { slug },
      { $set: { registrationOpen: data.registrationOpen } },
      { new: true },
    );

    if (!game)
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({
      success: true,
      registrationOpen: game.registrationOpen,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Please check the registration setting."
            : "Your change couldn’t be saved. Please try again.",
      },
      { status: error instanceof SyntaxError ? 400 : 503 },
    );
  }
}
