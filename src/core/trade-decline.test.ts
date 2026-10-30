import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";
import { declineTrade } from "./trade-decline.js";
import { asTradeId } from "./trade-id.js";

const tradeId = asTradeId("57202da8-3e09-40d6-9c0b-b42a4e149133");

function declineRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "PATCH" && url.pathname === `/api/trades/${tradeId}`
      ? response
      : undefined;
}

const gameDeclines = declineRoute({
  status: 200,
  body: { status: "declined" },
});

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

function declineRequests(requests: RecordedRequest[]) {
  return requests.filter(
    ({ url }) => url.pathname === `/api/trades/${tradeId}`,
  );
}

describe("declineTrade", () => {
  it("declines the trade and returns the status the game gives", async () => {
    const { session, requests } = await sessionWith(gameDeclines);

    await expect(declineTrade(session, tradeId)).resolves.toEqual({
      tradeId,
      status: "declined",
    });

    const [decline] = declineRequests(requests);
    expect(decline?.method).toBe("PATCH");
    expect(JSON.parse(decline?.body ?? "{}")).toEqual({ action: "decline" });
    expect(decline?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends exactly one request, leaving judging the refusal to the game", async () => {
    const { session, requests } = await sessionWith(gameDeclines);

    await declineTrade(session, tradeId);

    expect(
      requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
    ).toEqual(declineRequests(requests));
    expect(declineRequests(requests)).toHaveLength(1);
  });

  it.each([
    {
      reason: "human verification",
      status: 403,
      body: { code: "human_verification_required" },
      expected: /human_verification_required/,
    },
    {
      reason: "a trade no longer pending",
      status: 409,
      body: { error: "Cet échange n'est plus en attente" },
      expected: /Cet échange n'est plus en attente/,
    },
  ])(
    "reports the game's refusal for $reason with its reason",
    async ({ status, body, expected }) => {
      const { session } = await sessionWith(declineRoute({ status, body }));

      const failure = declineTrade(session, tradeId);

      await expect(failure).rejects.toThrow(WikiMastersError);
      await expect(failure).rejects.toThrow(expected);
    },
  );

  it("fails on a response without a status", async () => {
    const { session } = await sessionWith(
      declineRoute({ status: 200, body: { ok: true } }),
    );

    await expect(declineTrade(session, tradeId)).rejects.toThrow(
      /unexpected response, which may have declined it/,
    );
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      declineRoute({ status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(declineTrade(session, tradeId)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
