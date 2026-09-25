import { cookies } from "next/headers";
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import connectDB from "./mongodb";
import { Game } from "@/models/Game";

const scrypt = promisify(scryptCallback);
export function getAdminTokenName(slug: string) {
  return `admin_token_${slug}`;
}
const ADMIN_EVENTS_COOKIE = "admin_events";
const ORGANIZER_SESSION_COOKIE = "organizer_session";

function readAdminEvents(value?: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (slug): slug is string =>
              typeof slug === "string" && /^[a-z0-9-]{3,60}$/.test(slug),
          )
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
}

export async function rememberAdminEvent(slug: string) {
  const store = await cookies();
  const events = [
    slug,
    ...readAdminEvents(store.get(ADMIN_EVENTS_COOKIE)?.value).filter(
      (item) => item !== slug,
    ),
  ].slice(0, 30);
  store.set(ADMIN_EVENTS_COOKIE, JSON.stringify(events), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getRememberedAdminEvents() {
  return readAdminEvents((await cookies()).get(ADMIN_EVENTS_COOKIE)?.value);
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith("scrypt:")) {
    const left = Buffer.from(password);
    const right = Buffer.from(stored);
    return left.length === right.length && timingSafeEqual(left, right);
  }
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function signature(slug: string, expires: string, passwordHash: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET || passwordHash)
    .update(`${slug}:${expires}:${passwordHash}`)
    .digest("hex");
}
export async function setAdminToken(slug: string, passwordHash: string) {
  const expires = String(Date.now() + 7 * 24 * 60 * 60 * 1000);
  (await cookies()).set(
    getAdminTokenName(slug),
    `${expires}.${signature(slug, expires, passwordHash)}`,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
}
export async function setOrganizerSession(passwordHash: string) {
  const expires = String(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const proof = createHmac("sha256", passwordHash)
    .update(`organizer:${expires}`)
    .digest("hex");
  (await cookies()).set(ORGANIZER_SESSION_COOKIE, `${expires}.${proof}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
export async function verifyOrganizerSession() {
  const token = (await cookies()).get(ORGANIZER_SESSION_COOKIE)?.value;
  const [expires, received, extra] = token?.split(".") || [];
  if (
    extra ||
    !expires ||
    !received ||
    !/^\d{13}$/.test(expires) ||
    !/^[a-f0-9]{64}$/.test(received) ||
    Number(expires) < Date.now()
  )
    return false;
  await connectDB();
  const games = await Game.find({}).select("+adminPassword").lean();
  return games.some((game) => {
    const expected = createHmac("sha256", game.adminPassword)
      .update(`organizer:${expires}`)
      .digest("hex");
    return timingSafeEqual(
      Buffer.from(received, "hex"),
      Buffer.from(expected, "hex"),
    );
  });
}
export async function verifyAdminToken(slug: string): Promise<boolean> {
  const token = (await cookies()).get(getAdminTokenName(slug))?.value;
  if (!token) return verifyOrganizerSession();
  const [expires, received, extra] = token.split(".");
  if (
    extra ||
    !/^\d{13}$/.test(expires) ||
    !/^[a-f0-9]{64}$/.test(received || "") ||
    Number(expires) < Date.now()
  )
    return verifyOrganizerSession();
  await connectDB();
  const game = await Game.findOne({ slug }).select("+adminPassword");
  if (!game?.adminPassword?.startsWith("scrypt:"))
    return verifyOrganizerSession();
  if (
    timingSafeEqual(
      Buffer.from(received, "hex"),
      Buffer.from(signature(slug, expires, game.adminPassword), "hex"),
    )
  )
    return true;
  return verifyOrganizerSession();
}
export async function clearAdminToken(slug: string) {
  const store = await cookies();
  store.delete(getAdminTokenName(slug));
  store.delete(ORGANIZER_SESSION_COOKIE);
}
