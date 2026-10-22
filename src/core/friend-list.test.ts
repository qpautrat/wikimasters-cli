import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { listFriendships } from "./friend-list.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  USER_ID,
  type FakeResponse,
  type RecordedRequest,
} from "./testing/fake-supabase.js";

const FRIEND_ID = "da67926e-747a-4ca8-9fbf-67e1cf0b681e";
const REQUESTER_ID = "415ffaf4-4251-4119-bf6a-e4af25f63675";
const ADDRESSEE_ID = "debf5111-f4d7-4ab5-ace8-5449c0701dac";

function player(id: string, username: string) {
  return {
    id,
    username,
    avatar_url: null,
    avatar_pos_x: 50,
    avatar_pos_y: 50,
    activity_blocked_until: null,
  };
}

const me = player(USER_ID, "Moi");

function friendship(
  id: string,
  status: string,
  requester: ReturnType<typeof player>,
  addressee: ReturnType<typeof player>,
) {
  return {
    id,
    status,
    addressee,
    requester,
    created_at: "2026-10-22T14:50:22.575878+00:00",
    updated_at: "2026-10-22T14:50:22.575878+00:00",
    addressee_id: addressee.id,
    requester_id: requester.id,
  };
}

const accepted = friendship(
  "3b2a800e-5290-4037-85b5-105dd13ae7d7",
  "accepted",
  player(FRIEND_ID, "Plast8k"),
  me,
);
const received = friendship(
  "cdee9111-6a3d-4ce4-a1ab-278de345831d",
  "pending",
  player(REQUESTER_ID, "Joueur_00007"),
  me,
);
const sent = friendship(
  "d7c954fe-94fa-4f0c-8598-de8aba3d146c",
  "pending",
  me,
  player(ADDRESSEE_ID, "Smarkwood"),
);

function listed(friendships: unknown[]): FakeResponse {
  return {
    status: 200,
    body: { friendships },
  };
}

function isFriendList({ method, url }: RecordedRequest): boolean {
  return method === "GET" && url.pathname === "/api/friends";
}

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, (request) =>
    isFriendList(request) ? response : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const listRequests = () => requests.filter(isFriendList);
  return { session, listRequests };
}

describe("listFriendships", () => {
  it("returns each friendship in the game's order, with the other player and whether it is a friend, a received or a sent request", async () => {
    const { session } = await sessionAnswering(
      listed([sent, accepted, received]),
    );

    await expect(listFriendships(session)).resolves.toEqual([
      {
        friendshipId: sent.id,
        kind: "sent",
        playerId: ADDRESSEE_ID,
        username: "Smarkwood",
      },
      {
        friendshipId: accepted.id,
        kind: "friend",
        playerId: FRIEND_ID,
        username: "Plast8k",
      },
      {
        friendshipId: received.id,
        kind: "received",
        playerId: REQUESTER_ID,
        username: "Joueur_00007",
      },
    ]);
  });

  it("sends one request", async () => {
    const { session, listRequests } = await sessionAnswering(listed([]));

    await listFriendships(session);

    const [request, ...others] = listRequests();
    expect(others).toEqual([]);
    expect(request?.url.search).toBe("");
    expect(request?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("returns no friendship on an empty response", async () => {
    const { session } = await sessionAnswering(listed([]));

    await expect(listFriendships(session)).resolves.toEqual([]);
  });

  it("fails with the game's reason", async () => {
    const { session } = await sessionAnswering({
      status: 500,
      body: { error: "Erreur serveur" },
    });

    const failure = listFriendships(session);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      'Reading your friends and pending friend requests failed (HTTP 500): {"error":"Erreur serveur"}',
    );
  });

  it("asks to sign in again on HTTP 401", async () => {
    const { session } = await sessionAnswering({
      status: 401,
      body: { error: "Non authentifié" },
    });

    await expect(listFriendships(session)).rejects.toThrow(AuthRequiredError);
  });

  it("fails on an unexpected response", async () => {
    const { session } = await sessionAnswering({ status: 200, body: {} });

    await expect(listFriendships(session)).rejects.toThrow(
      /unexpected response/,
    );
  });

  it("fails on a friendship neither accepted nor pending", async () => {
    const { session } = await sessionAnswering(
      listed([{ ...received, status: "declined" }]),
    );

    await expect(listFriendships(session)).rejects.toThrow(
      /unexpected response/,
    );
  });

  it("fails on a friendship between two other players", async () => {
    const { session } = await sessionAnswering(
      listed([
        friendship(
          received.id,
          "pending",
          player(REQUESTER_ID, "Joueur_00007"),
          player(ADDRESSEE_ID, "Smarkwood"),
        ),
      ]),
    );

    await expect(listFriendships(session)).rejects.toThrow(
      /unexpected response/,
    );
  });
});
