import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import RegistrationRateLimit from "@/models/RegistrationRateLimit";

const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

export function deviceCookieName(slug: string) {
  return `event_device_${slug}`;
}
export function hashBrowserToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function getBrowserToken(
  request: NextRequest,
  slug: string,
  submittedToken: unknown,
) {
  const cookieToken = request.cookies.get(deviceCookieName(slug))?.value;
  const bodyToken = typeof submittedToken === "string" ? submittedToken : "";
  const token = cookieToken || bodyToken;
  return /^[a-f0-9-]{36}$/i.test(token) ? token : null;
}
export function getIpHash(request: NextRequest) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}
export async function checkRateLimit(gameId: unknown, ipHash: string) {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / WINDOW_MS) * WINDOW_MS);
  const expiresAt = new Date(windowStart.getTime() + WINDOW_MS);
  let entry;
  try {
    entry = await RegistrationRateLimit.findOneAndUpdate(
      { gameId, ipHash, windowStart },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true },
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    entry = await RegistrationRateLimit.findOneAndUpdate(
      { gameId, ipHash, windowStart },
      { $inc: { count: 1 } },
      { new: true },
    );
  }
  if (!entry) throw new Error("Unable to record registration attempt.");
  return {
    allowed: entry.count <= RATE_LIMIT,
    retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 60)),
  };
}
