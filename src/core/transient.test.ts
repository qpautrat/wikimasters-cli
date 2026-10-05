import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiUnavailableError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import { siteRequest } from "./site.js";
import { queryTable } from "./table-query.js";
import {
  failingFirst,
  fakeFetch,
  restRequest,
  restRoute,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";
import { RETRY_DELAYS_MS } from "./transient.js";

const NO_DELAY = [0, 0, 0];
const ROWS = [{ id: 1 }];
const readRows = restRoute("GET", "user_cards", { status: 200, body: ROWS });

function siteRoute(method: string, path: string): Route {
  return (request) =>
    request.method === method && request.url.pathname === path
      ? { status: 200, body: { ok: true } }
      : undefined;
}

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
    retryDelaysMs: NO_DELAY,
  });
  return { session, requests };
}

function requestsTo(requests: RecordedRequest[], pathname: string) {
  return requests.filter((request) => request.url.pathname === pathname);
}

function siteCall(
  session: Awaited<ReturnType<typeof sessionWith>>["session"],
  method: "GET" | "POST",
) {
  return siteRequest(
    session,
    "cookie",
    "Discarding cards",
    "/collection",
    "/api/user-cards/bulk-discard",
    method === "POST" ? { method, body: { card_ids: [] } } : { method },
  );
}

describe("retry on transient API errors", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits longer before each of its 3 retries", () => {
    expect(RETRY_DELAYS_MS).toHaveLength(3);
    for (let retry = 1; retry < RETRY_DELAYS_MS.length; retry += 1) {
      expect(RETRY_DELAYS_MS[retry]).toBeGreaterThan(
        RETRY_DELAYS_MS[retry - 1] ?? Number.POSITIVE_INFINITY,
      );
    }
  });

  it.each([502, 503, 504, 520, 521, 522, 523, 524, 525, 526])(
    "retries a PostgREST request after HTTP %i",
    async (status) => {
      const { session, requests } = await sessionWith(
        failingFirst(3, status, readRows),
      );

      await expect(queryTable(session, "user_cards")).resolves.toEqual(ROWS);
      expect(requestsTo(requests, "/rest/v1/user_cards")).toHaveLength(4);
    },
  );

  it("reports a one-line unavailability once every retry failed", async () => {
    const { session, requests } = await sessionWith(
      failingFirst(4, 525, readRows),
    );

    const failure = queryTable(session, "user_cards");

    await expect(failure).rejects.toBeInstanceOf(ApiUnavailableError);
    await expect(failure).rejects.toThrow(
      /^WikiMasters API unavailable \(HTTP 525: SSL handshake failed\), retry later$/,
    );
    expect(requestsTo(requests, "/rest/v1/user_cards")).toHaveLength(4);
  });

  it("does not retry another server error", async () => {
    const { session, requests } = await sessionWith(
      failingFirst(1, 500, readRows),
    );

    const failure = queryTable(session, "user_cards");

    await expect(failure).rejects.toBeInstanceOf(WikiMastersError);
    await expect(failure).rejects.not.toBeInstanceOf(ApiUnavailableError);
    expect(requests.filter(restRequest("GET", "user_cards"))).toHaveLength(1);
  });

  it("reports an unavailable auth server as a temporary failure", async () => {
    vi.useFakeTimers();
    const { fetch } = fakeFetch(failingFirst(100, 503, tokenRefresh));

    const failure = resumeSession({
      anonKey: "anon-key",
      refreshToken: "stored-token",
      fetch,
      retryDelaysMs: NO_DELAY,
    });
    const assertion = expect(failure).rejects.toThrow(
      /^WikiMasters API unavailable \(HTTP 503: service unavailable\), retry later$/,
    );
    await vi.runAllTimersAsync();

    await assertion;
  });

  it("retries a site read after HTTP 504", async () => {
    const path = "/api/user-cards/bulk-discard";
    const { session, requests } = await sessionWith(
      failingFirst(3, 504, siteRoute("GET", path)),
    );

    await expect(siteCall(session, "GET")).resolves.toEqual({ ok: true });
    expect(requestsTo(requests, path)).toHaveLength(4);
  });

  it.each([521, 522, 523, 525, 526])(
    "retries a site write the origin never received (HTTP %i)",
    async (status) => {
      const path = "/api/user-cards/bulk-discard";
      const { session, requests } = await sessionWith(
        failingFirst(3, status, siteRoute("POST", path)),
      );

      await expect(siteCall(session, "POST")).resolves.toEqual({ ok: true });
      expect(requestsTo(requests, path)).toHaveLength(4);
    },
  );

  it.each([502, 503, 504, 520, 524])(
    "never resends a site write the origin may have received (HTTP %i)",
    async (status) => {
      const path = "/api/user-cards/bulk-discard";
      const { session, requests } = await sessionWith(
        failingFirst(1, status, siteRoute("POST", path)),
      );

      const failure = siteCall(session, "POST");

      await expect(failure).rejects.toBeInstanceOf(ApiUnavailableError);
      await expect(failure).rejects.toThrow(
        /^WikiMasters API unavailable \(HTTP \d+: [^)]+\) after the request was sent: Discarding cards may have taken effect, check before running the command again$/,
      );
      expect(requestsTo(requests, path)).toHaveLength(1);
    },
  );
});
