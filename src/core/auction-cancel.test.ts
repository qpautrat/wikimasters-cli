import { describe, expect, it } from "vitest";
import { cancelAuction } from "./auction-cancel.js";
import { parseAuctionId } from "./auction.js";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const auctionId = parseAuctionId("d6669009-683d-44b6-b6e7-2c0960c37f2f");

function cancelRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "DELETE" && url.pathname === `/api/marketplace/${auctionId}`
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
    ({ url }) => url.pathname === `/api/marketplace/${auctionId}`,
  );
}

describe("cancelAuction", () => {
  it("cancels the auction and returns the status the game gives", async () => {
    const { session, requests } = await sessionWith(acceptCancel);

    await expect(cancelAuction(session, auctionId)).resolves.toEqual({
      auctionId,
      status: "cancelled",
    });

    const [cancel] = cancelRequests(requests);
    expect(cancel?.method).toBe("DELETE");
    expect(cancel?.body).toBeNull();
    expect(cancel?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends exactly one request, leaving judging the cancellation to the game", async () => {
    const { session, requests } = await sessionWith(acceptCancel);

    await cancelAuction(session, auctionId);

    expect(
      requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
    ).toEqual(cancelRequests(requests));
    expect(cancelRequests(requests)).toHaveLength(1);
  });

  it("reports the reason the game gives for refusing the cancellation", async () => {
    const { session } = await sessionWith(
      cancelRoute({
        status: 409,
        body: { error: "Cette enchère n'est plus active" },
      }),
    );

    const failure = cancelAuction(session, auctionId);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(/Cette enchère n'est plus active/);
  });

  it("fails on a response without a status", async () => {
    const { session } = await sessionWith(
      cancelRoute({ status: 200, body: { ok: true } }),
    );

    await expect(cancelAuction(session, auctionId)).rejects.toThrow(
      /unexpected response, which may have cancelled it/,
    );
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      cancelRoute({ status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(cancelAuction(session, auctionId)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
