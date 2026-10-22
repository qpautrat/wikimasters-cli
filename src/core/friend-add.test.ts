import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { sendFriendRequest } from "./friend-add.js";
import { asPlayerId } from "./player-id.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type FakeResponse,
  type RecordedRequest,
} from "./testing/fake-supabase.js";

const playerId = asPlayerId("37fe4f31-003f-40c1-9eb6-1f39e0947037");
const friendship = {
  id: "cdee9111-6a3d-4ce4-a1ab-278de345831d",
  requester_id: "8896a517-9221-44a0-8081-79bc4a5674ba",
  addressee_id: playerId,
  status: "pending",
  created_at: "2026-10-22T14:26:28.503781+00:00",
  updated_at: "2026-10-22T14:26:28.503781+00:00",
};

function isFriendRequest({ method, url }: RecordedRequest): boolean {
  return method === "POST" && url.pathname === "/api/friends";
}

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, (request) =>
    isFriendRequest(request) ? response : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const friendRequests = () => requests.filter(isFriendRequest);
  return { session, friendRequests };
}

describe("sendFriendRequest", () => {
  it("returns the request as the game returns it", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: { friendship },
    });

    await expect(sendFriendRequest(session, playerId)).resolves.toEqual(
      friendship,
    );
  });

  it("sends one request with the player id as given", async () => {
    const { session, friendRequests } = await sessionAnswering({
      status: 200,
      body: { friendship },
    });

    await sendFriendRequest(session, asPlayerId(" not-an-id"));

    const [request, ...others] = friendRequests();
    expect(others).toEqual([]);
    expect(JSON.parse(request?.body ?? "null")).toEqual({
      addressee_id: " not-an-id",
    });
    expect(request?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("fails with the game's reason", async () => {
    const { session } = await sessionAnswering({
      status: 429,
      body: {
        error: "Limite atteinte.",
        code: "friend_request_daily_limit",
        limit: 10,
        is_pro: false,
        resets_at: null,
      },
    });

    const failure = sendFriendRequest(session, playerId);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      `Sending a friend request to player ${playerId} failed (HTTP 429): {"error":"Limite atteinte."`,
    );
  });

  it("asks to sign in again on HTTP 401", async () => {
    const { session } = await sessionAnswering({
      status: 401,
      body: { error: "Non authentifié" },
    });

    await expect(sendFriendRequest(session, playerId)).rejects.toThrow(
      AuthRequiredError,
    );
  });

  it("fails on an unexpected response, which may have sent the request", async () => {
    const { session } = await sessionAnswering({ status: 200, body: {} });

    await expect(sendFriendRequest(session, playerId)).rejects.toThrow(
      /unexpected response, which may have sent it/,
    );
  });
});
