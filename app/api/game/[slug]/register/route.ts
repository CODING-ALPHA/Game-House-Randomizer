import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";
import Participant from "@/models/Participant";
import { assignGroup } from "@/lib/houseAssignment";
import {
  checkRateLimit,
  deviceCookieName,
  getBrowserToken,
  getIpHash,
  hashBrowserToken,
} from "@/lib/registrationSecurity";
import type { RegistrationField } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  let lock: { gameId: unknown; token: string } | null = null;
  let browserToken: string | null = null;
  try {
    const { slug } = await params;
    const input = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input))
      return NextResponse.json(
        { error: "Please check your registration details." },
        { status: 400 },
      );
    // An unobtrusive honeypot. Avoid common names such as "website" because
    // password managers and browser autofill can populate them for real people.
    if (typeof input.businessFax === "string" && input.businessFax.trim())
      return NextResponse.json(
        { error: "We couldn’t complete this registration." },
        { status: 400 },
      );
    await connectDB();
    const game = await Game.findOne({ slug });
    if (!game)
      return NextResponse.json(
        { error: "This event couldn’t be found." },
        { status: 404 },
      );
    if (!game.registrationOpen)
      return NextResponse.json(
        {
          error:
            "Registration has closed. Please contact your event organizer.",
        },
        { status: 403 },
      );
    browserToken = getBrowserToken(request, slug, input.browserToken);
    const data: Record<string, string> = {};
    for (const field of game.registrationFields as RegistrationField[]) {
      const raw = input[field.name];
      if (raw != null && typeof raw !== "string")
        return NextResponse.json(
          { error: `Please check ${field.name.toLowerCase()}.` },
          { status: 400 },
        );
      const value = (raw || "").trim();
      if ((field.required || field.isUniqueIdentifier) && !value)
        return NextResponse.json(
          { error: `Enter your ${field.name.toLowerCase()}.` },
          { status: 400 },
        );
      if (value.length > 300)
        return NextResponse.json(
          { error: `${field.name} must be under 300 characters.` },
          { status: 400 },
        );
      if (
        value &&
        field.type === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      )
        return NextResponse.json(
          { error: "Enter a valid email address." },
          { status: 400 },
        );
      if (value && field.type === "number" && !Number.isFinite(Number(value)))
        return NextResponse.json(
          { error: `${field.name} must be a number.` },
          { status: 400 },
        );
      if (
        value &&
        field.type === "select" &&
        field.options?.length &&
        !field.options.includes(value)
      )
        return NextResponse.json(
          { error: `Choose a valid ${field.name.toLowerCase()}.` },
          { status: 400 },
        );
      if (
        value &&
        field.regexValidation &&
        !new RegExp(field.regexValidation).test(value)
      )
        return NextResponse.json(
          {
            error:
              field.errorMessage ||
              `Please check your ${field.name.toLowerCase()}.`,
          },
          { status: 400 },
        );
      data[field.name] = field.type === "email" ? value.toLowerCase() : value;
    }
    const uniqueField = (game.registrationFields as RegistrationField[]).find(
      (field) => field.isUniqueIdentifier,
    );
    const identifier = uniqueField ? data[uniqueField.name] : undefined;
    const rateLimit = await checkRateLimit(game._id, getIpHash(request));
    if (!rateLimit.allowed)
      return NextResponse.json(
        {
          error: `Too many registration attempts from this connection. Please try again in about ${rateLimit.retryAfter} minutes.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter * 60) },
        },
      );
    // Serialize allocation across server instances so concurrent registrations stay balanced.
    const token = randomUUID();
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const acquired = await Game.findOneAndUpdate(
        {
          _id: game._id,
          registrationOpen: true,
          $or: [
            { assignmentLockUntil: { $exists: false } },
            { assignmentLockUntil: { $lt: new Date() } },
          ],
        },
        {
          $set: {
            assignmentLockToken: token,
            assignmentLockUntil: new Date(Date.now() + 30000),
          },
        },
      );
      if (acquired) {
        lock = { gameId: game._id, token };
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    if (!lock)
      return NextResponse.json(
        {
          error:
            "Registration is busy or has just closed. Please try again in a moment.",
        },
        { status: 503 },
      );
    if (browserToken) {
      const existingBrowser = await Participant.findOne({
        gameId: game._id,
        browserTokenHash: hashBrowserToken(browserToken),
      });
      if (existingBrowser)
        return NextResponse.json(
          {
            alreadyRegistered: true,
            groupName: existingBrowser.groupName,
            error: "This browser already has a team for this event.",
          },
          { status: 409 },
        );
    }
    if (identifier) {
      const existing = await Participant.findOne({
        gameId: game._id,
        uniqueIdentifier: identifier,
      });
      if (existing)
        return NextResponse.json(
          {
            alreadyRegistered: true,
            groupName: existing.groupName,
            error: "You already have a team.",
          },
          { status: 409 },
        );
    }
    const groupName = await assignGroup(
      game._id.toString(),
      game.groups.map((group: { name: string }) => group.name),
    );
    const nameField =
      (game.registrationFields as RegistrationField[]).find((field) =>
        /name/i.test(field.name),
      ) || game.registrationFields[0];
    await Participant.create({
      gameId: game._id,
      name: data[nameField?.name] || "Participant",
      uniqueIdentifier: identifier || `anonymous:${randomUUID()}`,
      data,
      groupName,
      ...(browserToken
        ? { browserTokenHash: hashBrowserToken(browserToken) }
        : {}),
    });
    const response = NextResponse.json(
      { success: true, groupName },
      { status: 201 },
    );
    if (browserToken)
      response.cookies.set(deviceCookieName(slug), browserToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Please check your registration details."
            : "We couldn’t complete registration. Please try again with the same details.",
      },
      { status: error instanceof SyntaxError ? 400 : 503 },
    );
  } finally {
    if (lock)
      await Game.updateOne(
        { _id: lock.gameId, assignmentLockToken: lock.token },
        { $unset: { assignmentLockToken: 1, assignmentLockUntil: 1 } },
      ).catch((error) =>
        console.error("Allocation lock cleanup failed:", error),
      );
  }
}
