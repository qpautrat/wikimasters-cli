import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { acceptFriendRequest } from "./friend-accept.js";
import { asFriendshipId } from "./friendship-id.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const friendshipId = asFriendshipId("c33d11f8-973d-43f5-8045-18f22caaa6d7");

function acceptRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "PATCH" && url.pathname === `/api/friends/${friendshipId}`
      ? response
      : undefined;
}

const gameAccepts = acceptRoute({
  status: 200,
  body: { status: "accepted" },
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

function acceptRequests(requests: RecordedRequest[]) {
  return requests.filter(
    ({ url }) => url.pathname === `/api/friends/${friendshipId}`,
  );
}

describe("acceptFriendRequest", () => {
  it("accepts the request and returns the status the game gives", async () => {
    const { session, requests } = await sessionWith(gameAccepts);

    await expect(acceptFriendRequest(session, friendshipId)).resolves.toEqual({
      friendshipId,
      status: "accepted",
    });

    const [accept] = acceptRequests(requests);
    expect(accept?.method).toBe("PATCH");
    expect(JSON.parse(accept?.body ?? "{}")).toEqual({ action: "accept" });
    expect(accept?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends exactly one request, leaving judging the acceptance to the game", async () => {
    const { session, requests } = await sessionWith(gameAccepts);

    await acceptFriendRequest(session, friendshipId);

    expect(
      requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
    ).toEqual(acceptRequests(requests));
    expect(acceptRequests(requests)).toHaveLength(1);
  });

  it("sends the friendship id as given", async () => {
    const { session, requests } = await sessionWith(({ method, url }) =>
      method === "PATCH" && url.pathname === "/api/friends/not-an-id"
        ? { status: 200, body: { status: "accepted" } }
        : undefined,
    );

    await acceptFriendRequest(session, asFriendshipId("not-an-id"));

    expect(
      requests.filter(({ url }) => url.pathname === "/api/friends/not-an-id"),
    ).toHaveLength(1);
  });

  it.each([
    {
      reason: "an unknown request",
      status: 404,
      body: { error: "Demande introuvable" },
      expected: /\(HTTP 404\).*Demande introuvable/,
    },
    {
      reason: "a request already answered",
      status: 409,
      body: { error: "Demande déjà traitée" },
      expected: /\(HTTP 409\).*Demande déjà traitée/,
    },
  ])(
    "reports the game's refusal for $reason with its reason",
    async ({ status, body, expected }) => {
      const { session } = await sessionWith(acceptRoute({ status, body }));

      const failure = acceptFriendRequest(session, friendshipId);

      await expect(failure).rejects.toThrow(WikiMastersError);
      await expect(failure).rejects.toThrow(expected);
    },
  );

  it("fails on a response without a status", async () => {
    const { session } = await sessionWith(
      acceptRoute({ status: 200, body: { ok: true } }),
    );

    await expect(acceptFriendRequest(session, friendshipId)).rejects.toThrow(
      /unexpected response, which may have accepted it/,
    );
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      acceptRoute({ status: 401, body: { error: "Non autorisé" } }),
    );

    await expect(acceptFriendRequest(session, friendshipId)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
