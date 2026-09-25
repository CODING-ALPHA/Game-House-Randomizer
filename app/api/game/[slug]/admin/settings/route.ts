import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";
import Participant from "@/models/Participant";
import { verifyAdminToken } from "@/lib/adminAuth";
import { isTeamLink } from "@/lib/client";

type IncomingGroup = {
  name: string;
  colorHex: string;
  emoji?: string;
  whatsappLink?: string;
  originalName?: string;
};
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!(await verifyAdminToken(slug)))
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const body = await request.json();
    if (
      !body ||
      typeof body.name !== "string" ||
      typeof body.description !== "string" ||
      typeof body.themeColor !== "string" ||
      (body.themeSecondaryColor != null &&
        typeof body.themeSecondaryColor !== "string") ||
      !Array.isArray(body.groups)
    )
      return NextResponse.json(
        { error: "Please check the event details." },
        { status: 400 },
      );
    const groups = body.groups as IncomingGroup[];
    if (
      !body.name.trim() ||
      body.name.trim().length > 100 ||
      body.description.length > 500 ||
      !/^#[0-9a-f]{6}$/i.test(body.themeColor) ||
      (body.themeSecondaryColor &&
        !/^#[0-9a-f]{6}$/i.test(body.themeSecondaryColor)) ||
      groups.length < 2 ||
      groups.length > 20
    )
      return NextResponse.json(
        { error: "Check the event name, color, and team count." },
        { status: 400 },
      );
    const normalized = groups.map((group) => ({
      ...group,
      name: group.name?.trim(),
      emoji: group.emoji?.trim() || "",
      whatsappLink: group.whatsappLink?.trim() || "",
    }));
    const names = new Set<string>();
    if (
      normalized.some(
        (group) =>
          !group.name ||
          group.name.length > 50 ||
          names.has(group.name.toLowerCase()) ||
          (names.add(group.name.toLowerCase()), false) ||
          !/^#[0-9a-f]{6}$/i.test(group.colorHex) ||
          group.emoji.length > 12 ||
          (group.whatsappLink && !isTeamLink(group.whatsappLink)),
      )
    )
      return NextResponse.json(
        {
          error:
            "Each team needs a unique name, valid color, and valid link if included.",
        },
        { status: 400 },
      );
    await connectDB();
    const game = await Game.findOne({ slug });
    if (!game)
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    const existingNames = new Set<string>(
      game.groups.map((group: IncomingGroup) => group.name),
    );
    const retained = new Set<string>(
      normalized.map((group) => group.originalName || group.name),
    );
    const removed = [...existingNames].filter((name) => !retained.has(name));
    if (
      removed.length &&
      (await Participant.exists({
        gameId: game._id,
        groupName: { $in: removed },
      }))
    )
      return NextResponse.json(
        { error: "Move participants out of a team before removing it." },
        { status: 409 },
      );
    for (const group of normalized)
      if (group.originalName && group.originalName !== group.name)
        await Participant.updateMany(
          { gameId: game._id, groupName: group.originalName },
          { $set: { groupName: group.name } },
        );
    game.name = body.name.trim();
    game.description = body.description.trim();
    game.themeColor = body.themeColor;
    game.themeSecondaryColor = body.themeSecondaryColor || "#D18B48";
    game.groups = normalized.map(({ originalName, ...group }) => group);
    await game.save();
    const publicGame = game.toObject();
    delete publicGame.adminPassword;
    return NextResponse.json({ game: publicGame });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Please check the event details."
            : "We couldn’t save event settings. Please try again.",
      },
      { status: error instanceof SyntaxError ? 400 : 503 },
    );
  }
}
