import { describe, expect, it } from "vitest";
import { AuthRequiredError } from "./errors.js";
import { resumeSession } from "./session.js";
import { tagEntry, untagEntry } from "./tag.js";
import {
  ACCESS_TOKEN,
  fakeFetch,
  restRoute,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

const entryId = "944d72cb-9118-41ff-ba3b-026c47ec27fc";
const history = {
  id: "37a20595-c848-4755-8c80-df2fefde56e6",
  name: "Histoire",
};

const tagInsert = restRoute("POST", "user_card_tags", { status: 201 });

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

describe("tagEntry", () => {
  it("links the given label to the given entry in a single request", async () => {
    const { session, requests } = await sessionWith(tagInsert);

    await expect(tagEntry(session, entryId, history.id)).resolves.toEqual({
      entryId,
      labelId: history.id,
    });
    const restRequests = requests.filter(({ url }) =>
      url.pathname.startsWith("/rest/v1/"),
    );
    expect(restRequests).toHaveLength(1);
    const insert = restRequests[0];
    expect(insert?.method).toBe("POST");
    expect(insert?.url.pathname).toBe("/rest/v1/user_card_tags");
    expect(JSON.parse(insert?.body ?? "null")).toEqual({
      user_card_id: entryId,
      tag_id: history.id,
    });
    expect(insert?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("fails with the game's reason when it refuses the label", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "user_card_tags", {
        status: 409,
        body: {
          code: "23505",
          message:
            'duplicate key value violates unique constraint "user_card_tags_pkey"',
        },
      }),
    );

    await expect(tagEntry(session, entryId, history.id)).rejects.toThrow(
      /user_card_tags_pkey/,
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "user_card_tags", {
        status: 401,
        body: { code: "PGRST303", message: "JWT expired" },
      }),
    );

    await expect(tagEntry(session, entryId, history.id)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});

function tagDeletion(deletedRows: number): Route {
  return restRoute("DELETE", "user_card_tags", {
    status: 204,
    headers: { "content-range": `*/${deletedRows}` },
  });
}

describe("untagEntry", () => {
  it("unlinks the given label from the given entry in a single request", async () => {
    const { session, requests } = await sessionWith(tagDeletion(1));

    await expect(untagEntry(session, entryId, history.id)).resolves.toEqual({
      entryId,
      labelId: history.id,
      removed: true,
    });
    const restRequests = requests.filter(({ url }) =>
      url.pathname.startsWith("/rest/v1/"),
    );
    expect(restRequests).toHaveLength(1);
    const deletion = restRequests[0];
    expect(deletion?.method).toBe("DELETE");
    expect(deletion?.url.pathname).toBe("/rest/v1/user_card_tags");
    expect(deletion?.url.searchParams.get("user_card_id")).toBe(
      `eq.${entryId}`,
    );
    expect(deletion?.url.searchParams.get("tag_id")).toBe(`eq.${history.id}`);
    expect(deletion?.headers.get("prefer")).toContain("count=exact");
    expect(deletion?.headers.get("authorization")).toBe(
      `Bearer ${ACCESS_TOKEN}`,
    );
  });

  it("succeeds without change when the entry does not carry the label", async () => {
    const { session } = await sessionWith(tagDeletion(0));

    await expect(untagEntry(session, entryId, history.id)).resolves.toEqual({
      entryId,
      labelId: history.id,
      removed: false,
    });
  });

  it("fails with the game's reason when it refuses the removal", async () => {
    const { session } = await sessionWith(
      restRoute("DELETE", "user_card_tags", {
        status: 400,
        body: {
          code: "22P02",
          message: 'invalid input syntax for type uuid: "abc"',
        },
      }),
    );

    await expect(untagEntry(session, "abc", history.id)).rejects.toThrow(
      /invalid input syntax for type uuid/,
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(
      restRoute("DELETE", "user_card_tags", {
        status: 401,
        body: { code: "PGRST303", message: "JWT expired" },
      }),
    );

    await expect(untagEntry(session, entryId, history.id)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
