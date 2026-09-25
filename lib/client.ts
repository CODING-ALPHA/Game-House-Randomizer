export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}
export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
      cache: "no-store",
    });
    const data = await response.json().catch(() => {
      throw new RequestError(
        "The server sent an unexpected response. Please try again.",
        response.status,
      );
    });
    if (!data || typeof data !== "object") {
      throw new RequestError(
        "The server sent an unexpected response. Please try again.",
        response.status,
      );
    }
    if (!response.ok)
      throw new RequestError(
        data.error || "Something went wrong. Please try again.",
        response.status,
        data,
      );
    return data as T;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    if (error instanceof Error && error.name === "AbortError")
      throw new Error("This is taking longer than expected. Please try again.");
    throw new Error(
      "We couldn’t connect. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
export function isTeamLink(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !!url.hostname;
  } catch {
    return false;
  }
}
// Kept as an alias while existing integrations transition to the generic team link.
export const isWhatsAppLink = isTeamLink;
export function rememberGroup(slug: string, group: string) {
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      window[storage].setItem(`game_${slug}_group`, group);
      return;
    } catch {
      /* Try the other storage. */
    }
  }
}
export function recallGroup(slug: string) {
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      const group = window[storage].getItem(`game_${slug}_group`);
      if (group) return group;
    } catch {
      /* Storage may be disabled. */
    }
  }
  return null;
}

export function getBrowserRegistrationToken(slug: string) {
  const key = `game_${slug}_browser_token`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing && /^[a-f0-9-]{36}$/i.test(existing)) return existing;
    const token = crypto.randomUUID();
    window.localStorage.setItem(key, token);
    return token;
  } catch {
    return crypto.randomUUID();
  }
}
