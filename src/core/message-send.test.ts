import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { sendMessage } from "./message-send.js";
import { asPlayerId } from "./player-id.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const playerId = asPlayerId("37fe4f31-003f-40c1-9eb6-1f39e0947037");
const messageId = "f9774a20-e48b-4b85-97e7-fff435001dd1";

function chatRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "POST" && url.pathname === `/api/chat/${playerId}`
      ? response
      : undefined;
}

const gameSends = chatRoute({
  status: 200,
  body: { message: { id: messageId, content: "Hello" } },
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

function chatRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname === `/api/chat/${playerId}`);
}

describe("sendMessage", () => {
  it("sends the text as given and returns the message id", async () => {
    const { session, requests } = await sessionWith(gameSends);

    await expect(
      sendMessage(session, playerId, "  Hello, a counter-offer  "),
    ).resolves.toEqual({ messageId });

    const [chat] = chatRequests(requests);
    expect(JSON.parse(chat?.body ?? "{}")).toEqual({
      content: "  Hello, a counter-offer  ",
    });
    expect(chat?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends exactly one request, leaving judging the refusal to the game", async () => {
    const { session, requests } = await sessionWith(gameSends);

    await sendMessage(session, playerId, "Hello");

    expect(
      requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
    ).toEqual(chatRequests(requests));
    expect(chatRequests(requests)).toHaveLength(1);
  });

  it.each([
    {
      reason: "a blocked sending",
      status: 403,
      body: { error: "Envoi bloqué" },
      expected: /Envoi bloqué/,
    },
    {
      reason: "an unknown player",
      status: 500,
      body: { error: "Erreur serveur" },
      expected: /Erreur serveur/,
    },
  ])(
    "reports the game's refusal for $reason with its reason",
    async ({ status, body, expected }) => {
      const { session } = await sessionWith(chatRoute({ status, body }));

      const failure = sendMessage(session, playerId, "Hello");

      await expect(failure).rejects.toThrow(WikiMastersError);
      await expect(failure).rejects.toThrow(expected);
    },
  );

  it("fails on a response without a message id", async () => {
    const { session } = await sessionWith(
      chatRoute({ status: 200, body: { ok: true } }),
    );

    await expect(sendMessage(session, playerId, "Hello")).rejects.toThrow(
      /unexpected response, which may have sent it/,
    );
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      chatRoute({ status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(sendMessage(session, playerId, "Hello")).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
