import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { asGuildId } from "./guild-id.js";
import { joinGuild } from "./guild-join.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const guildId = asGuildId("768c8705-546d-44c8-a495-cffd0bf1d29f");

function joinRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "POST" && url.pathname === "/api/guilds/join"
      ? response
      : undefined;
}

const gameAccepts = joinRoute({ status: 200, body: { ok: true } });

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

function joinRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname === "/api/guilds/join");
}

describe("joinGuild", () => {
  it("joins the guild and returns the result the game gives", async () => {
    const { session, requests } = await sessionWith(gameAccepts);

    await expect(joinGuild(session, guildId)).resolves.toEqual({
      guildId,
      ok: true,
    });

    const [join] = joinRequests(requests);
    expect(join?.method).toBe("POST");
    expect(JSON.parse(join?.body ?? "{}")).toEqual({ guild_id: guildId });
    expect(join?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends exactly one request, leaving judging the invitation to the game", async () => {
    const { session, requests } = await sessionWith(gameAccepts);

    await joinGuild(session, guildId);

    expect(
      requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
    ).toEqual(joinRequests(requests));
    expect(joinRequests(requests)).toHaveLength(1);
  });

  it("sends the guild id as given", async () => {
    const { session, requests } = await sessionWith(gameAccepts);

    await joinGuild(session, asGuildId("not-an-id"));

    expect(JSON.parse(joinRequests(requests)[0]?.body ?? "{}")).toEqual({
      guild_id: "not-an-id",
    });
  });

  it.each([
    {
      reason: "a guild without a valid invitation",
      status: 404,
      body: { error: "Guilde introuvable" },
      expected: /\(HTTP 404\).*Guilde introuvable/,
    },
    {
      reason: "a player already in a guild",
      status: 409,
      body: { error: "Vous êtes déjà dans une guilde" },
      expected: /\(HTTP 409\).*Vous êtes déjà dans une guilde/,
    },
  ])(
    "reports the game's refusal for $reason with its reason",
    async ({ status, body, expected }) => {
      const { session } = await sessionWith(joinRoute({ status, body }));

      const failure = joinGuild(session, guildId);

      await expect(failure).rejects.toThrow(WikiMastersError);
      await expect(failure).rejects.toThrow(expected);
    },
  );

  it.each([{ ok: false }, { status: "joined" }])(
    "fails on a response other than ok: %j",
    async (body) => {
      const { session } = await sessionWith(joinRoute({ status: 200, body }));

      await expect(joinGuild(session, guildId)).rejects.toThrow(
        /unexpected response, which may have joined it/,
      );
    },
  );

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      joinRoute({ status: 401, body: { error: "Non autorisé" } }),
    );

    await expect(joinGuild(session, guildId)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
