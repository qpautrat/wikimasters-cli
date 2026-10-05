import { describe, expect, it } from "vitest";
import {
  ApiUnavailableError,
  AuthRequiredError,
  WikiMastersError,
} from "./errors.js";
import { resumeSession } from "./session.js";
import {
  type SiteSendInit,
  sendSiteRequest,
  siteFailure,
  siteRequest,
} from "./site.js";
import {
  type FakeResponse,
  type Route,
  failingFirst,
  fakeFetch,
  tokenRefresh,
} from "./testing/fake-supabase.js";

const PATH = "/api/marketplace/42";
const REFUSAL = { card_id: "c1", error: "card_not_owned" };

function siteRoute(method: string, response: FakeResponse): Route {
  return (request) =>
    request.method === method &&
    request.url.host === "www.wiki-masters.com" &&
    request.url.pathname === PATH
      ? response
      : undefined;
}

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
    retryDelaysMs: [0, 0, 0],
  });
  return { session, requests };
}

async function send(init: SiteSendInit, ...routes: Route[]) {
  const { session, requests } = await sessionWith(...routes);
  const sent = sendSiteRequest(
    session,
    "auth-cookie",
    "Cancelling the sale",
    "/marketplace",
    PATH,
    init,
  );
  const siteRequests = () =>
    requests.filter((request) => request.url.pathname === PATH);
  return { sent, siteRequests };
}

describe("sendSiteRequest", () => {
  it("sends the session cookie and the browser's Origin and Referer, without a body", async () => {
    const { sent, siteRequests } = await send(
      { method: "DELETE" },
      siteRoute("DELETE", { status: 200, body: { ok: true } }),
    );

    await expect(sent).resolves.toEqual({
      status: 200,
      ok: true,
      location: null,
      body: '{"ok":true}',
    });
    const [request] = siteRequests();
    expect(request?.headers.get("cookie")).toBe("auth-cookie");
    expect(request?.headers.get("origin")).toBe("https://www.wiki-masters.com");
    expect(request?.headers.get("referer")).toBe(
      "https://www.wiki-masters.com/marketplace",
    );
    expect(request?.headers.has("content-type")).toBe(false);
    expect(request?.body).toBeNull();
  });

  it("sends a body as JSON", async () => {
    const { sent, siteRequests } = await send(
      { method: "PATCH", body: { price: 10 } },
      siteRoute("PATCH", { status: 200, body: {} }),
    );

    await sent;
    const [request] = siteRequests();
    expect(request?.headers.get("content-type")).toBe("application/json");
    expect(request?.body).toBe('{"price":10}');
  });

  it("returns the status and body of a refusal", async () => {
    const { sent } = await send(
      { method: "POST", body: {} },
      siteRoute("POST", { status: 400, body: REFUSAL }),
    );

    await expect(sent).resolves.toEqual({
      status: 400,
      ok: false,
      location: null,
      body: JSON.stringify(REFUSAL),
    });
  });

  it("returns a redirect without following it", async () => {
    const { sent, siteRequests } = await send(
      { method: "GET" },
      siteRoute("GET", { status: 307, headers: { location: "/login" } }),
    );

    await expect(sent).resolves.toMatchObject({
      status: 307,
      ok: false,
      location: "/login",
    });
    expect(siteRequests()).toHaveLength(1);
  });

  it("retries a read after a transient error", async () => {
    const { sent, siteRequests } = await send(
      { method: "GET" },
      failingFirst(2, 503, siteRoute("GET", { status: 200, body: [] })),
    );

    await expect(sent).resolves.toMatchObject({ status: 200, body: "[]" });
    expect(siteRequests()).toHaveLength(3);
  });

  it("never resends a write the origin may have received", async () => {
    const { sent, siteRequests } = await send(
      { method: "DELETE" },
      failingFirst(1, 524, siteRoute("DELETE", { status: 200, body: {} })),
    );

    await expect(sent).rejects.toThrow(/may have taken effect/);
    await expect(sent).rejects.toBeInstanceOf(ApiUnavailableError);
    expect(siteRequests()).toHaveLength(1);
  });
});

describe("siteRequest", () => {
  it("turns a refusal into an error carrying the site's answer", async () => {
    const { session } = await sessionWith(
      siteRoute("POST", { status: 400, body: REFUSAL }),
    );

    const failure = siteRequest(
      session,
      "auth-cookie",
      "Cancelling the sale",
      "/marketplace",
      PATH,
      { method: "POST", body: {} },
    );

    await expect(failure).rejects.toThrow(
      `Cancelling the sale failed (HTTP 400): ${JSON.stringify(REFUSAL)}`,
    );
    await expect(failure).rejects.toBeInstanceOf(WikiMastersError);
  });

  it("asks to log in again on HTTP 401", async () => {
    const { session } = await sessionWith(
      siteRoute("GET", { status: 401, body: {} }),
    );

    await expect(
      siteRequest(session, "auth-cookie", "Reading", "/", PATH, {
        method: "GET",
      }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("asks to log in again when redirected to the login page", async () => {
    const { session } = await sessionWith(
      siteRoute("GET", {
        status: 307,
        headers: { location: "https://www.wiki-masters.com/login" },
      }),
    );

    await expect(
      siteRequest(session, "auth-cookie", "Reading", "/", PATH, {
        method: "GET",
      }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });
});

describe("siteFailure", () => {
  const redirect = (location: string) => ({
    status: 307,
    ok: false,
    location,
    body: "",
  });

  it.each([
    "/login",
    "/login?next=%2Fmarketplace",
    "https://www.wiki-masters.com/login",
  ])("asks to log in again on a redirect to %s", (location) => {
    const failure = siteFailure("Reading", redirect(location));

    expect(failure).toBeInstanceOf(AuthRequiredError);
    expect(failure.message).toMatch(/run `wikimasters login`/);
  });

  it.each(["/pulls", "http://[bad"])(
    "keeps a redirect to %s a plain failure",
    (location) => {
      const failure = siteFailure("Reading", redirect(location));

      expect(failure).not.toBeInstanceOf(AuthRequiredError);
      expect(failure.message).toBe("Reading failed (HTTP 307): ");
    },
  );
});
