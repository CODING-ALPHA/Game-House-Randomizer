import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";
import {
  clearAdminToken,
  hashPassword,
  rememberAdminEvent,
  setAdminToken,
  setOrganizerSession,
  verifyPassword,
} from "@/lib/adminAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const data = await request.json();
    if (
      !data ||
      typeof data.password !== "string" ||
      typeof data.email !== "string" ||
      !data.password ||
      data.password.length > 128
    )
      return NextResponse.json(
        { error: "Enter your admin email and password." },
        { status: 400 },
      );
    await connectDB();
    const game = await Game.findOne({ slug }).select("+adminPassword");
    if (!game)
      return NextResponse.json(
        { error: "We couldn’t find this event. Check your event link." },
        { status: 404 },
      );
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json(
        { error: "Enter a valid admin email address." },
        { status: 400 },
      );
    if (game.adminEmail && game.adminEmail !== email)
      return NextResponse.json(
        { error: "That email does not manage this event." },
        { status: 401 },
      );
    if (!(await verifyPassword(data.password, game.adminPassword)))
      return NextResponse.json(
        { error: "That password doesn’t match. Check it and try again." },
        { status: 401 },
      );
    if (!game.adminPassword.startsWith("scrypt:")) {
      game.adminPassword = await hashPassword(data.password);
      await game.save();
    }
    if (!game.adminEmail) {
      game.adminEmail = email;
      await game.save();
    }
    await setAdminToken(slug, game.adminPassword);
    await setOrganizerSession(game.adminPassword);
    await rememberAdminEvent(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Please enter a valid password."
            : "We couldn’t sign you in right now. Please try again.",
      },
      { status: error instanceof SyntaxError ? 400 : 503 },
    );
  }
}
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await clearAdminToken((await params).slug);
  return NextResponse.json({ success: true });
}
