import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { removeFriendship } from "./friend-remove.js";
import { asFriendshipId } from "./friendship-id.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const friendshipId = asFriendshipId("d7c954fe-94fa-4f0c-8598-de8aba3d146c");

function removeRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "DELETE" && url.pathname === `/api/friends/${friendshipId}`
      ? response
      : undefined;
}

const gameRemoves = removeRoute({ status: 200, body: { success: true } });

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

function removeRequests(requests: RecordedRequest[]) {
  return requests.filter(
    ({ url }) => url.pathname === `/api/friends/${friendshipId}`,
  );
}

describe("removeFriendship", () => {
  it("removes the friendship and returns the success the game gives", async () => {
    const { session, requests } = await sessionWith(gameRemoves);

    await expect(removeFriendship(session, friendshipId)).resolves.toEqual({
      friendshipId,
      success: true,
    });

    const [remove] = removeRequests(requests);
    expect(remove?.method).toBe("DELETE");
    expect(remove?.body).toBeNull();
    expect(remove?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends exactly one request, leaving judging the removal to the game", async () => {
    const { session, requests } = await sessionWith(gameRemoves);

    await removeFriendship(session, friendshipId);

    expect(
      requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
    ).toEqual(removeRequests(requests));
    expect(removeRequests(requests)).toHaveLength(1);
  });

  it("sends the friendship id as given", async () => {
    const { session, requests } = await sessionWith(({ method, url }) =>
      method === "DELETE" && url.pathname === "/api/friends/not-an-id"
        ? { status: 200, body: { success: true } }
        : undefined,
    );

    await removeFriendship(session, asFriendshipId("not-an-id"));

    expect(
      requests.filter(({ url }) => url.pathname === "/api/friends/not-an-id"),
    ).toHaveLength(1);
  });

  it("reports the reason the game gives for refusing the removal", async () => {
    const { session } = await sessionWith(
      removeRoute({ status: 404, body: { error: "Introuvable" } }),
    );

    const failure = removeFriendship(session, friendshipId);

    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(/\(HTTP 404\).*Introuvable/);
  });

  it.each([{ success: false }, { status: "removed" }])(
    "fails on a response that does not report success: %j",
    async (body) => {
      const { session } = await sessionWith(removeRoute({ status: 200, body }));

      await expect(removeFriendship(session, friendshipId)).rejects.toThrow(
        "unexpected response, which may have removed it",
      );
    },
  );

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      removeRoute({ status: 401, body: { error: "Non autorisé" } }),
    );

    await expect(removeFriendship(session, friendshipId)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
