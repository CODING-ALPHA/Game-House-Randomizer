import { isTeamLink } from "./client";
import type { Group } from "./types";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
export function validateEvent(data: {
  name: string;
  slug: string;
  adminPassword: string;
  adminEmail: string;
  themeColor: string;
  themeSecondaryColor?: string;
  description?: string;
  groups: Group[];
}) {
  const errors: Record<string, string> = {};
  if (!data.name.trim() || data.name.trim().length > 100)
    errors.name = "Enter an event name, up to 100 characters.";
  if (!/^[a-z0-9](?:[a-z0-9-]{1,58})[a-z0-9]$/.test(data.slug))
    errors.slug =
      "Use 3–60 lowercase letters, numbers, or hyphens. Start and end with a letter or number.";
  if (data.adminPassword.trim().length < 8 || data.adminPassword.length > 128)
    errors.adminPassword = "Choose a password with 8–128 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail.trim()))
    errors.adminEmail = "Enter a valid admin email address.";
  if (!/^#[0-9a-f]{6}$/i.test(data.themeColor))
    errors.themeColor = "Choose a valid accent color.";
  if (
    data.themeSecondaryColor &&
    !/^#[0-9a-f]{6}$/i.test(data.themeSecondaryColor)
  )
    errors.themeSecondaryColor = "Choose a valid second theme color.";
  if ((data.description?.length ?? 0) > 500)
    errors.description = "Keep the description under 500 characters.";
  if (data.groups.length < 2 || data.groups.length > 20)
    errors.groups = "Create between 2 and 20 teams.";
  const names = new Set<string>();
  data.groups.forEach((group, i) => {
    const name = group.name.trim().toLowerCase();
    if (!name || name.length > 50)
      errors[`group-${i}-name`] = "Enter a team name, up to 50 characters.";
    else if (names.has(name))
      errors[`group-${i}-name`] = "Each team needs a different name.";
    names.add(name);
    if (!/^#[0-9a-f]{6}$/i.test(group.colorHex))
      errors[`group-${i}-colorHex`] = "Choose a valid team color.";
    if ((group.emoji?.length ?? 0) > 12)
      errors[`group-${i}-emoji`] = "Use a short symbol or emoji.";
    if (
      group.whatsappLink?.trim() &&
      (!isTeamLink(group.whatsappLink.trim()) ||
        group.whatsappLink.length > 300)
    )
      errors[`group-${i}-whatsappLink`] =
        "Enter a valid link beginning with https:// or http://.";
  });
  return errors;
}
