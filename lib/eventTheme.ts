import type { CSSProperties } from "react";

function luminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((part) => Number.parseInt(part, 16) / 255);
  if (!channels || channels.length !== 3) return 0;
  return channels.reduce(
    (sum, channel) =>
      sum +
      (channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4),
    0,
  );
}

export function eventThemeStyle(
  primary: string,
  secondary?: string,
): CSSProperties {
  const safePrimary = /^#[0-9a-f]{6}$/i.test(primary) ? primary : "#557445";
  const safeSecondary = /^#[0-9a-f]{6}$/i.test(secondary || "")
    ? secondary!
    : "#D18B48";
  return {
    "--event-primary": safePrimary,
    "--event-secondary": safeSecondary,
    "--event-on-primary": luminance(safePrimary) > 0.36 ? "#10231d" : "#ffffff",
    "--event-primary-wash": `${safePrimary}18`,
    "--event-secondary-wash": `${safeSecondary}1f`,
  } as CSSProperties;
}
