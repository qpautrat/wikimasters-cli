import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { acceptFriendRequest, declineFriendRequest } from "./friend-answer.js";
import { asFriendshipId } from "./friendship-id.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const friendshipId = asFriendshipId("c33d11f8-973d-43f5-8045-18f22caaa6d7");

function answerRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "PATCH" && url.pathname === `/api/friends/${friendshipId}`
      ? response
      : undefined;
}

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

function answerRequests(requests: RecordedRequest[]) {
  return requests.filter(
    ({ url }) => url.pathname === `/api/friends/${friendshipId}`,
  );
}

const unknownRequest = {
  reason: "an unknown request",
  httpStatus: 404,
  body: { error: "Demande introuvable" },
  expected: /\(HTTP 404\).*Demande introuvable/,
};

describe.each([
  {
    answerFriendRequest: acceptFriendRequest,
    action: "accept",
    status: "accepted",
    refusals: [
      unknownRequest,
      {
        reason: "a request already accepted",
        httpStatus: 409,
        body: { error: "Demande déjà traitée" },
        expected: /\(HTTP 409\).*Demande déjà traitée/,
      },
    ],
  },
  {
    answerFriendRequest: declineFriendRequest,
    action: "decline",
    status: "declined",
    refusals: [
      unknownRequest,
      {
        reason: "a request already declined",
        httpStatus: 404,
        body: { error: "Demande introuvable" },
        expected: /\(HTTP 404\).*Demande introuvable/,
      },
    ],
  },
])(
  "$answerFriendRequest.name",
  ({ answerFriendRequest, action, status, refusals }) => {
    const gameAnswers = answerRoute({ status: 200, body: { status } });

    it(`sends ${action} and returns the status the game gives`, async () => {
      const { session, requests } = await sessionWith(gameAnswers);

      await expect(answerFriendRequest(session, friendshipId)).resolves.toEqual(
        {
          friendshipId,
          status,
        },
      );

      const [answer] = answerRequests(requests);
      expect(answer?.method).toBe("PATCH");
      expect(JSON.parse(answer?.body ?? "{}")).toEqual({ action });
      expect(answer?.headers.get("cookie")).toMatch(
        new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
      );
    });

    it("sends exactly one request, leaving judging the answer to the game", async () => {
      const { session, requests } = await sessionWith(gameAnswers);

      await answerFriendRequest(session, friendshipId);

      expect(
        requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
      ).toEqual(answerRequests(requests));
      expect(answerRequests(requests)).toHaveLength(1);
    });

    it("sends the friendship id as given", async () => {
      const { session, requests } = await sessionWith(({ method, url }) =>
        method === "PATCH" && url.pathname === "/api/friends/not-an-id"
          ? { status: 200, body: { status } }
          : undefined,
      );

      await answerFriendRequest(session, asFriendshipId("not-an-id"));

      expect(
        requests.filter(({ url }) => url.pathname === "/api/friends/not-an-id"),
      ).toHaveLength(1);
    });

    it.each(refusals)(
      "reports the game's refusal for $reason with its reason",
      async ({ httpStatus, body, expected }) => {
        const { session } = await sessionWith(
          answerRoute({ status: httpStatus, body }),
        );

        const failure = answerFriendRequest(session, friendshipId);

        await expect(failure).rejects.toThrow(WikiMastersError);
        await expect(failure).rejects.toThrow(expected);
      },
    );

    it("fails on a response without a status", async () => {
      const { session } = await sessionWith(
        answerRoute({ status: 200, body: { ok: true } }),
      );

      await expect(answerFriendRequest(session, friendshipId)).rejects.toThrow(
        `unexpected response, which may have ${status} it`,
      );
    });

    it("asks for a new login when the site rejects the session", async () => {
      const { session } = await sessionWith(
        answerRoute({ status: 401, body: { error: "Non autorisé" } }),
      );

      await expect(answerFriendRequest(session, friendshipId)).rejects.toThrow(
        AuthRequiredError,
      );
    });
  },
);
