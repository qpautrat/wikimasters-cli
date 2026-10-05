import { authCookieHeader } from "./auth-cookie.js";
import { WikiMastersError, apiFailure, outcomeUnknown } from "./errors.js";
import type { Session } from "./session.js";
import { SITE_URL } from "./supabase.js";
import {
  fetchRetrying,
  isPossiblyDeliveredStatus,
  isTransientStatus,
  isUndeliveredStatus,
} from "./transient.js";

export const SITE_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type SiteMethod = (typeof SITE_METHODS)[number];

export type SiteSendInit =
  | { method: "GET" }
  | { method: Exclude<SiteMethod, "GET">; body?: unknown };

type SiteRequestInit = { method: "GET" } | { method: "POST"; body: unknown };

export interface SiteResponse {
  status: number;
  body: string;
}

export async function siteCookie(session: Session): Promise<string> {
  const { data, error } = await session.client.auth.getSession();
  if (error || !data.session) {
    throw new WikiMastersError("The session holds no access token");
  }
  return authCookieHeader(data.session);
}

export async function sendSiteRequest(
  session: Session,
  cookie: string,
  action: string,
  fromPage: string,
  path: string,
  init: SiteSendInit,
): Promise<SiteResponse> {
  const isRead = init.method === "GET";
  const hasBody = "body" in init;
  const response = await fetchRetrying(
    session.fetch,
    session.retryDelaysMs,
    isRead ? isTransientStatus : isUndeliveredStatus,
    `${SITE_URL}${path}`,
    {
      method: init.method,
      headers: {
        Cookie: cookie,
        Origin: SITE_URL,
        Referer: `${SITE_URL}${fromPage}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(init.body) } : {}),
    },
  );
  const text = await response.text();
  if (!isRead && isPossiblyDeliveredStatus(response.status)) {
    throw outcomeUnknown(action, response.status);
  }
  if (response.status === 401 || isTransientStatus(response.status)) {
    throw apiFailure(action, response.status, text);
  }
  return { status: response.status, body: text };
}

export async function siteRequest(
  session: Session,
  cookie: string,
  action: string,
  fromPage: string,
  path: string,
  init: SiteRequestInit,
): Promise<unknown> {
  const { status, body } = await sendSiteRequest(
    session,
    cookie,
    action,
    fromPage,
    path,
    init,
  );
  if (status < 200 || status >= 300) throw apiFailure(action, status, body);
  try {
    return JSON.parse(body);
  } catch {
    throw new WikiMastersError(`${action} returned no JSON: ${body}`);
  }
}
