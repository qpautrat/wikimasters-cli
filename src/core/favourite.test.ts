import { describe, expect, it } from "vitest";
import { asEntryId } from "./entry-id.js";
import { AuthRequiredError } from "./errors.js";
import { starEntry, unstarEntry } from "./favourite.js";
import { resumeSession } from "./session.js";
import {
  ACCESS_TOKEN,
  fakeFetch,
  restRequest,
  restRoute,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

const entryId = asEntryId("944d72cb-9118-41ff-ba3b-026c47ec27fc");

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
  { name: "starEntry", change: starEntry, starred: true },
  { name: "unstarEntry", change: unstarEntry, starred: false },
])("$name", ({ change, starred }) => {
  it("changes the entry's favourite state in a single request filtered on its id", async () => {
    const { session, requests } = await sessionWith(entryUpdate(1));

    await expect(change(session, entryId)).resolves.toEqual({
      entryId,
      starred,
    });
    expect(
      requests.filter((request) => request.url.pathname.startsWith("/rest/")),
    ).toHaveLength(1);
    const update = requests.find(restRequest("PATCH", "user_cards"));
    expect([...(update?.url.searchParams ?? [])]).toEqual([
      ["id", `eq.${entryId}`],
    ]);
    expect(JSON.parse(update?.body ?? "null")).toEqual({ starred });
    expect(update?.headers.get("prefer")).toContain("count=exact");
    expect(update?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("fails when the game changes no entry", async () => {
    const { session } = await sessionWith(entryUpdate(0));

    await expect(change(session, entryId)).rejects.toThrow(
      /changed no entry: the entry is unknown or not yours; nothing was changed/,
    );
  });

  it("reports the game's refusal", async () => {
    const { session } = await sessionWith(
      restRoute("PATCH", "user_cards", {
        status: 400,
        body: {
          code: "22P02",
          message: 'invalid input syntax for type uuid: "abc"',
        },
      }),
    );

    await expect(change(session, asEntryId("abc"))).rejects.toThrow(
      /invalid input syntax for type uuid/,
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(
      restRoute("PATCH", "user_cards", {
        status: 401,
        body: { code: "PGRST303", message: "JWT expired" },
      }),
    );

    await expect(change(session, entryId)).rejects.toThrow(AuthRequiredError);
  });
});
