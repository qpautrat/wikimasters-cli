import { describe, expect, it } from "vitest";
import { parseCardId } from "./card-id.js";
import { AuthRequiredError } from "./errors.js";
import { starCard, unstarCard } from "./favourite.js";
import { resumeSession } from "./session.js";
import {
  ACCESS_TOKEN,
  USER_ID,
  fakeFetch,
  restRoute,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

const cardId = parseCardId("3fc9a132-31db-4b14-832c-04823e02113d");
const entryId = "944d72cb-9118-41ff-ba3b-026c47ec27fc";

function collectionEntry(starred: boolean | null): Route {
  return restRoute("GET", "user_cards", {
    status: 200,
    body: starred === null ? [] : [{ id: entryId, starred }],
  });
}

function entryUpdate(updatedRows: number): Route {
  return restRoute("PATCH", "user_cards", {
    status: 204,
    headers: { "content-range": `*/${updatedRows}` },
  });
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

describe.each([
  { name: "starCard", change: starCard, starred: true },
  { name: "unstarCard", change: unstarCard, starred: false },
])("$name", ({ change, starred }) => {
  it("updates the collection entry of the signed-in user for that card", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry(!starred),
      entryUpdate(1),
    );

    await expect(change(session, cardId)).resolves.toEqual({
      cardId,
      starred,
      changed: true,
    });
    const read = requests.find(({ method }) => method === "GET");
    expect(read?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(read?.url.searchParams.get("card_id")).toBe(`eq.${cardId}`);
    expect(read?.url.searchParams.get("count")).toBe("gt.0");
    const update = requests.find(({ method }) => method === "PATCH");
    expect(update?.url.searchParams.get("id")).toBe(`eq.${entryId}`);
    expect(update?.url.searchParams.get("starred")).toBe(`eq.${!starred}`);
    expect(JSON.parse(update?.body ?? "null")).toEqual({ starred });
    expect(update?.headers.get("prefer")).toContain("count=exact");
    expect(update?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("succeeds without change when the card already is in that state", async () => {
    const { session, requests } = await sessionWith(collectionEntry(starred));

    await expect(change(session, cardId)).resolves.toEqual({
      cardId,
      starred,
      changed: false,
    });
    expect(requests.some(({ method }) => method === "PATCH")).toBe(false);
  });

  it("refuses a card absent from the collection without change", async () => {
    const { session, requests } = await sessionWith(collectionEntry(null));

    await expect(change(session, cardId)).rejects.toThrow(
      /not in your collection/,
    );
    expect(requests.some(({ method }) => method === "PATCH")).toBe(false);
  });

  it("fails without change when the entry changed meanwhile", async () => {
    const { session } = await sessionWith(
      collectionEntry(!starred),
      entryUpdate(0),
    );

    await expect(change(session, cardId)).rejects.toThrow(
      /changed meanwhile; nothing was changed/,
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(({ method }) =>
      method === "GET"
        ? { status: 401, body: { code: "PGRST303", message: "JWT expired" } }
        : undefined,
    );

    await expect(change(session, cardId)).rejects.toThrow(AuthRequiredError);
  });
});
