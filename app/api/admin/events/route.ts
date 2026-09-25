import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";
import { verifyOrganizerSession } from "@/lib/adminAuth";

export async function GET() {
  try {
    const canManage = await verifyOrganizerSession();
    await connectDB();
    const games = await Game.find({})
      .select(
        "name slug description themeColor themeSecondaryColor registrationOpen groups createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      events: games.map((game) => ({
        ...game,
        canManage,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "We couldn’t load your events. Please try again." },
      { status: 503 },
    );
  }
}
