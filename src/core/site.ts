import { authCookieHeader } from "./auth-cookie.js";
import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";
import { SITE_URL } from "./supabase.js";

type SiteRequestInit = { method: "GET" } | { method: "POST"; body: unknown };

export async function siteCookie(session: Session): Promise<string> {
  const { data, error } = await session.client.auth.getSession();
  if (error || !data.session) {
    throw new WikiMastersError("The session holds no access token");
  }
  return authCookieHeader(data.session);
}

export async function siteRequest(
  session: Session,
  cookie: string,
  action: string,
  fromPage: string,
  path: string,
  init: SiteRequestInit,
): Promise<unknown> {
  const response = await session.fetch(`${SITE_URL}${path}`, {
    method: init.method,
    headers: {
      Cookie: cookie,
      Origin: SITE_URL,
      Referer: `${SITE_URL}${fromPage}`,
      ...(init.method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(init.method === "POST" ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await response.text();
  if (!response.ok) throw apiFailure(action, response.status, text);
  try {
    return JSON.parse(text);
  } catch {
    throw new WikiMastersError(`${action} returned no JSON: ${text}`);
  }
}
