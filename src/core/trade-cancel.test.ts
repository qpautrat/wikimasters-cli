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
import { cancelTrade } from "./trade-cancel.js";
import { asTradeId } from "./trade-id.js";

const tradeId = asTradeId("57202da8-3e09-40d6-9c0b-b42a4e149133");

function cancelRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "PATCH" && url.pathname === `/api/trades/${tradeId}`
      ? response
      : undefined;
}

const acceptCancel = cancelRoute({
  status: 200,
  body: { status: "cancelled" },
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

function cancelRequests(requests: RecordedRequest[]) {
  return requests.filter(
    ({ url }) => url.pathname === `/api/trades/${tradeId}`,
  );
}

describe("cancelTrade", () => {
  it("cancels the trade and returns the status the game gives", async () => {
    const { session, requests } = await sessionWith(acceptCancel);

    await expect(cancelTrade(session, tradeId)).resolves.toEqual({
      tradeId,
      status: "cancelled",
    });

    const [cancel] = cancelRequests(requests);
    expect(cancel?.method).toBe("PATCH");
    expect(JSON.parse(cancel?.body ?? "{}")).toEqual({ action: "cancel" });
    expect(cancel?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends exactly one request, leaving judging the cancellation to the game", async () => {
    const { session, requests } = await sessionWith(acceptCancel);

    await cancelTrade(session, tradeId);

    expect(
      requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
    ).toEqual(cancelRequests(requests));
    expect(cancelRequests(requests)).toHaveLength(1);
  });

  it.each([
    {
      reason: "human verification",
      status: 403,
      body: {
        error: "Vérification humaine requise",
        code: "human_verification_required",
      },
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
      const { session } = await sessionWith(cancelRoute({ status, body }));

      const failure = cancelTrade(session, tradeId);

      await expect(failure).rejects.toThrow(WikiMastersError);
      await expect(failure).rejects.toThrow(expected);
    },
  );

  it("fails on a response without a status", async () => {
    const { session } = await sessionWith(
      cancelRoute({ status: 200, body: { ok: true } }),
    );

    await expect(cancelTrade(session, tradeId)).rejects.toThrow(
      /unexpected response, which may have cancelled it/,
    );
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      cancelRoute({ status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(cancelTrade(session, tradeId)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
