import { describe, expect, it } from "vitest";
import { parseCardId } from "./card-id.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { starCard, unstarCard } from "./favourite.js";
import { resumeSession } from "./session.js";
import {
  ACCESS_TOKEN,
  USER_ID,
  fakeFetch,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

const cardId = parseCardId("3fc9a132-31db-4b14-832c-04823e02113d");
const entryId = "944d72cb-9118-41ff-ba3b-026c47ec27fc";

function collectionEntry(starred: boolean | null): Route {
  return ({ method, url }) =>
    method === "GET" && url.pathname === "/rest/v1/user_cards"
      ? {
          status: 200,
          body: starred === null ? [] : [{ id: entryId, starred }],
        }
      : undefined;
}

function entryUpdate(updatedRows: number): Route {
  return ({ method, url }) =>
    method === "PATCH" && url.pathname === "/rest/v1/user_cards"
      ? { status: 204, headers: { "content-range": `*/${updatedRows}` } }
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

describe("starCard", () => {
  it("stars the collection entry of the signed-in user for that card", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry(false),
      entryUpdate(1),
    );

    await expect(starCard(session, cardId)).resolves.toEqual({
      cardId,
      starred: true,
      changed: true,
    });
    const read = requests.find(({ method }) => method === "GET");
    expect(read?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(read?.url.searchParams.get("card_id")).toBe(`eq.${cardId}`);
    expect(read?.url.searchParams.get("count")).toBe("gt.0");
    const update = requests.find(({ method }) => method === "PATCH");
    expect(update?.url.searchParams.get("id")).toBe(`eq.${entryId}`);
    expect(JSON.parse(update?.body ?? "null")).toEqual({ starred: true });
    expect(update?.headers.get("prefer")).toContain("count=exact");
    expect(update?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("succeeds without change when the card is already starred", async () => {
    const { session, requests } = await sessionWith(collectionEntry(true));

    await expect(starCard(session, cardId)).resolves.toEqual({
      cardId,
      starred: true,
      changed: false,
    });
    expect(requests.some(({ method }) => method === "PATCH")).toBe(false);
  });

  it("refuses a card absent from the collection without change", async () => {
    const { session, requests } = await sessionWith(collectionEntry(null));

    await expect(starCard(session, cardId)).rejects.toThrow(
      /not in your collection/,
    );
    expect(requests.some(({ method }) => method === "PATCH")).toBe(false);
  });

  it("fails when the update changes no entry", async () => {
    const { session } = await sessionWith(
      collectionEntry(false),
      entryUpdate(0),
    );

    await expect(starCard(session, cardId)).rejects.toThrow(WikiMastersError);
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(({ method }) =>
      method === "GET"
        ? { status: 401, body: { code: "PGRST303", message: "JWT expired" } }
        : undefined,
    );

    await expect(starCard(session, cardId)).rejects.toThrow(AuthRequiredError);
  });
});

describe("unstarCard", () => {
  it("unstars the collection entry of the signed-in user for that card", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry(true),
      entryUpdate(1),
    );

    await expect(unstarCard(session, cardId)).resolves.toEqual({
      cardId,
      starred: false,
      changed: true,
    });
    const update = requests.find(({ method }) => method === "PATCH");
    expect(update?.url.searchParams.get("id")).toBe(`eq.${entryId}`);
    expect(JSON.parse(update?.body ?? "null")).toEqual({ starred: false });
  });

  it("succeeds without change when the card is not starred", async () => {
    const { session, requests } = await sessionWith(collectionEntry(false));

    await expect(unstarCard(session, cardId)).resolves.toEqual({
      cardId,
      starred: false,
      changed: false,
    });
    expect(requests.some(({ method }) => method === "PATCH")).toBe(false);
  });

  it("refuses a card absent from the collection without change", async () => {
    const { session, requests } = await sessionWith(collectionEntry(null));

    await expect(unstarCard(session, cardId)).rejects.toThrow(
      /not in your collection/,
    );
    expect(requests.some(({ method }) => method === "PATCH")).toBe(false);
  });
});
