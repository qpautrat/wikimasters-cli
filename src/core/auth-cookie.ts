import { WikiMastersError } from "./errors.js";
import { SUPABASE_PROJECT_REF } from "./supabase.js";

export const AUTH_COOKIE_NAME = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

const BASE64_PREFIX = "base64-";

export interface Cookie {
  name: string;
  value: string;
}

function combineChunks(cookies: readonly Cookie[]): string | undefined {
  const byName = new Map(cookies.map(({ name, value }) => [name, value]));
  const whole = byName.get(AUTH_COOKIE_NAME);
  if (whole) return whole;

  const chunks: string[] = [];
  for (let index = 0; byName.has(`${AUTH_COOKIE_NAME}.${index}`); index++) {
    chunks.push(byName.get(`${AUTH_COOKIE_NAME}.${index}`) ?? "");
  }
  return chunks.length > 0 ? chunks.join("") : undefined;
}

function decodeSession(raw: string): unknown {
  const json = raw.startsWith(BASE64_PREFIX)
    ? Buffer.from(raw.slice(BASE64_PREFIX.length), "base64url").toString("utf8")
    : decodeURIComponent(raw);
  return JSON.parse(json);
}

export function refreshTokenFromAuthCookies(
  cookies: readonly Cookie[],
): string | undefined {
  const raw = combineChunks(cookies);
  if (raw === undefined) return undefined;

  let session: unknown;
  try {
    session = decodeSession(raw);
  } catch {
    throw new WikiMastersError(`Unreadable ${AUTH_COOKIE_NAME} cookie`);
  }
  if (
    typeof session !== "object" ||
    session === null ||
    !("refresh_token" in session) ||
    typeof session.refresh_token !== "string"
  ) {
    throw new WikiMastersError(
      `The ${AUTH_COOKIE_NAME} cookie holds no refresh token`,
    );
  }
  return session.refresh_token;
}

// @supabase/ssr reads the unchunked cookie before any `.N` chunk; its 3180-byte chunk limit only matters to browsers.
export function authCookieHeader(session: object): string {
  const encoded = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );
  return `${AUTH_COOKIE_NAME}=${BASE64_PREFIX}${encoded}`;
}
