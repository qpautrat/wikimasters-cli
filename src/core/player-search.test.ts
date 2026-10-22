import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { PLAYER_SEARCH_LIMIT, searchPlayers } from "./player-search.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type FakeResponse,
  type RecordedRequest,
} from "./testing/fake-supabase.js";

const PLAYER_ID = "3b7a519d-ebfa-4517-a5b9-df69cfbb8d54";
const OTHER_PLAYER_ID = "12189d96-49ff-4e91-b729-8fb8fe7411b3";

function user(id: string, username: string) {
  return {
    id,
    username,
    avatar_url: null,
    avatar_pos_x: 50,
    avatar_pos_y: 50,
  };
}

function found(users: unknown[]): FakeResponse {
  return { status: 200, body: { users } };
}

function isSearch({ method, url }: RecordedRequest): boolean {
  return method === "GET" && url.pathname === "/api/friends/search";
}

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, (request) =>
    isSearch(request) ? response : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const searchRequests = () => requests.filter(isSearch);
  return { session, searchRequests };
}

describe("searchPlayers", () => {
  it("returns each player found with its id and pseudo", async () => {
    const { session } = await sessionAnswering(
      found([user(PLAYER_ID, "Luc"), user(OTHER_PLAYER_ID, "luc.")]),
    );

    await expect(searchPlayers(session, "luc")).resolves.toEqual({
      users: [
        { id: PLAYER_ID, username: "Luc" },
        { id: OTHER_PLAYER_ID, username: "luc." },
      ],
      full: false,
    });
  });

  it("sends one request with the text as given, whatever its length", async () => {
    const { session, searchRequests } = await sessionAnswering(found([]));

    await searchPlayers(session, " l");

    const [request, ...others] = searchRequests();
    expect(others).toEqual([]);
    expect(Object.fromEntries(request?.url.searchParams ?? [])).toEqual({
      q: " l",
    });
    expect(request?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("reports a response holding as many players as the game returns at most", async () => {
    const { session } = await sessionAnswering(
      found(
        Array.from({ length: PLAYER_SEARCH_LIMIT }, () =>
          user(PLAYER_ID, "Luc"),
        ),
      ),
    );

    await expect(searchPlayers(session, "luc")).resolves.toMatchObject({
      full: true,
    });
  });

  it("returns no player on an empty response", async () => {
    const { session } = await sessionAnswering(found([]));

    await expect(searchPlayers(session, "zzqqxx")).resolves.toEqual({
      users: [],
      full: false,
    });
  });

  it("fails with the game's reason", async () => {
    const { session } = await sessionAnswering({
      status: 500,
      body: { error: "Erreur serveur" },
    });

    const failure = searchPlayers(session, "luc");
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      'Searching the players matching "luc" failed (HTTP 500): {"error":"Erreur serveur"}',
    );
  });

  it("asks to sign in again on HTTP 401", async () => {
    const { session } = await sessionAnswering({
      status: 401,
      body: { error: "Non authentifié" },
    });

    await expect(searchPlayers(session, "luc")).rejects.toThrow(
      AuthRequiredError,
    );
  });

  it("fails on an unexpected response", async () => {
    const { session } = await sessionAnswering({ status: 200, body: {} });

    await expect(searchPlayers(session, "luc")).rejects.toThrow(
      /unexpected response/,
    );
  });
});
