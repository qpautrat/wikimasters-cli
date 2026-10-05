import { authCookieHeader } from "./auth-cookie.js";
import {
  AuthRequiredError,
  WikiMastersError,
  apiFailure,
  outcomeUnknown,
} from "./errors.js";
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

export interface SiteResponse {
  status: number;
  ok: boolean;
  location: string | null;
  body: string;
}

function redirectsToLogin({ status, location }: SiteResponse): boolean {
  return (
    status >= 300 &&
    status < 400 &&
    location !== null &&
    URL.canParse(location, SITE_URL) &&
    new URL(location, SITE_URL).pathname === "/login"
  );
}

export function siteFailure(
  action: string,
  response: SiteResponse,
): WikiMastersError {
  if (redirectsToLogin(response)) {
    return new AuthRequiredError(
      `${action} was redirected to the login page: the session is no longer valid`,
    );
  }
  return apiFailure(action, response.status, response.body);
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
      redirect: "manual",
    },
  );
  const text = await response.text();
  if (!isRead && isPossiblyDeliveredStatus(response.status)) {
    throw outcomeUnknown(action, response.status);
  }
  if (isTransientStatus(response.status)) {
    throw apiFailure(action, response.status, text);
  }
  return {
    status: response.status,
    ok: response.ok,
    location: response.headers.get("location"),
    body: text,
  };
}

export async function siteRequest(
  session: Session,
  cookie: string,
  action: string,
  fromPage: string,
  path: string,
  init: SiteSendInit,
): Promise<unknown> {
  const response = await sendSiteRequest(
    session,
    cookie,
    action,
    fromPage,
    path,
    init,
  );
  if (!response.ok) throw siteFailure(action, response);
  try {
    return JSON.parse(response.body);
  } catch {
    throw new WikiMastersError(`${action} returned no JSON: ${response.body}`);
  }
}
