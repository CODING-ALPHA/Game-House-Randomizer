import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    await connectDB();
    // Return game info (excluding adminPassword)
    const game = await Game.findOne({ slug }).select("-adminPassword");

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch {
    return NextResponse.json(
      { error: "We couldn’t load this event. Please try again." },
      { status: 503 },
    );
  }
}
