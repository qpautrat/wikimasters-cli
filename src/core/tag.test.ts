import { describe, expect, it } from "vitest";
import { parseCardId } from "./card-id.js";
import { AuthRequiredError } from "./errors.js";
import { resumeSession } from "./session.js";
import { tagCard, untagCard } from "./tag.js";
import {
  ACCESS_TOKEN,
  USER_ID,
  fakeFetch,
  restRequest,
  restRoute,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const cardId = parseCardId("3fc9a132-31db-4b14-832c-04823e02113d");
const entryId = "944d72cb-9118-41ff-ba3b-026c47ec27fc";
const history = {
  id: "37a20595-c848-4755-8c80-df2fefde56e6",
  name: "Histoire",
};
const films = {
  id: "8d41679f-9344-4c39-afe4-f1089320d2bd",
  name: "Films & Séries",
};

function collectionEntry(tagIds: string[] | null): Route {
  return restRoute("GET", "user_cards", {
    status: 200,
    body:
      tagIds === null
        ? []
        : [
            {
              id: entryId,
              user_card_tags: tagIds.map((tag_id) => ({ tag_id })),
            },
          ],
  });
}

function labels(...tags: { id: string; name: string }[]): Route {
  return restRoute("GET", "tags", { status: 200, body: tags });
}

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

function writes(requests: RecordedRequest[]) {
  return requests.filter(
    ({ method, url }) =>
      method !== "GET" && url.pathname.startsWith("/rest/v1/"),
  );
}

describe("tagCard", () => {
  it("links the label of the signed-in user to their collection entry for that card", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry([films.id]),
      labels(films, history),
      tagInsert,
    );

    await expect(tagCard(session, cardId, "Histoire")).resolves.toEqual({
      cardId,
      label: "Histoire",
      tagged: true,
      changed: true,
    });
    const entryRead = requests.find(restRequest("GET", "user_cards"));
    expect(entryRead?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(entryRead?.url.searchParams.get("card_id")).toBe(`eq.${cardId}`);
    expect(entryRead?.url.searchParams.get("count")).toBe("gt.0");
    const labelRead = requests.find(restRequest("GET", "tags"));
    expect(labelRead?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
    const insert = requests.find(restRequest("POST", "user_card_tags"));
    expect(JSON.parse(insert?.body ?? "null")).toEqual({
      user_card_id: entryId,
      tag_id: history.id,
    });
    expect(insert?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("succeeds without change when the card already has the label", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry([history.id]),
      labels(films, history),
    );

    await expect(tagCard(session, cardId, "Histoire")).resolves.toEqual({
      cardId,
      label: "Histoire",
      tagged: true,
      changed: false,
    });
    expect(writes(requests)).toEqual([]);
  });

  it("succeeds without change when the label was put on the card meanwhile", async () => {
    const { session } = await sessionWith(
      collectionEntry([]),
      labels(history),
      ({ method }) =>
        method === "POST"
          ? {
              status: 409,
              body: {
                code: "23505",
                message:
                  'duplicate key value violates unique constraint "user_card_tags_pkey"',
              },
            }
          : undefined,
    );

    await expect(tagCard(session, cardId, "Histoire")).resolves.toEqual({
      cardId,
      label: "Histoire",
      tagged: true,
      changed: false,
    });
  });

  it("refuses a card absent from the collection without change", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry(null),
      labels(history),
    );

    await expect(tagCard(session, cardId, "Histoire")).rejects.toThrow(
      /not in your collection; nothing was changed/,
    );
    expect(writes(requests)).toEqual([]);
  });

  it("refuses an unknown label without change, listing the user's labels", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry([]),
      labels(films, history),
    );

    await expect(tagCard(session, cardId, "histoire")).rejects.toThrow(
      'No label named "histoire"; your labels: "Films & Séries", "Histoire"; nothing was changed',
    );
    expect(writes(requests)).toEqual([]);
  });

  it("says the user has no labels when refusing an unknown one", async () => {
    const { session } = await sessionWith(collectionEntry([]), labels());

    await expect(tagCard(session, cardId, "Histoire")).rejects.toThrow(
      'No label named "Histoire"; you have no labels; nothing was changed',
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(({ method }) =>
      method === "GET"
        ? { status: 401, body: { code: "PGRST303", message: "JWT expired" } }
        : undefined,
    );

    await expect(tagCard(session, cardId, "Histoire")).rejects.toThrow(
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

describe("untagCard", () => {
  it("unlinks the label of the signed-in user from their collection entry for that card", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry([history.id]),
      labels(films, history),
      tagDeletion(1),
    );

    await expect(untagCard(session, cardId, "Histoire")).resolves.toEqual({
      cardId,
      label: "Histoire",
      tagged: false,
      changed: true,
    });
    const labelRead = requests.find(restRequest("GET", "tags"));
    expect(labelRead?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
    const deletion = requests.find(({ method }) => method === "DELETE");
    expect(deletion?.url.searchParams.get("user_card_id")).toBe(
      `eq.${entryId}`,
    );
    expect(deletion?.url.searchParams.get("tag_id")).toBe(`eq.${history.id}`);
    expect(deletion?.headers.get("prefer")).toContain("count=exact");
    expect(deletion?.headers.get("authorization")).toBe(
      `Bearer ${ACCESS_TOKEN}`,
    );
  });

  it("succeeds without change when the card does not have the label", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry([films.id]),
      labels(films, history),
    );

    await expect(untagCard(session, cardId, "Histoire")).resolves.toEqual({
      cardId,
      label: "Histoire",
      tagged: false,
      changed: false,
    });
    expect(writes(requests)).toEqual([]);
  });

  it("succeeds without change when the label was removed meanwhile", async () => {
    const { session } = await sessionWith(
      collectionEntry([history.id]),
      labels(history),
      tagDeletion(0),
    );

    await expect(untagCard(session, cardId, "Histoire")).resolves.toEqual({
      cardId,
      label: "Histoire",
      tagged: false,
      changed: false,
    });
  });

  it("refuses a card absent from the collection without change", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry(null),
      labels(history),
    );

    await expect(untagCard(session, cardId, "Histoire")).rejects.toThrow(
      /not in your collection; nothing was changed/,
    );
    expect(writes(requests)).toEqual([]);
  });

  it("refuses an unknown label without change, listing the user's labels", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry([history.id]),
      labels(films, history),
    );

    await expect(untagCard(session, cardId, "Sport")).rejects.toThrow(
      'No label named "Sport"; your labels: "Films & Séries", "Histoire"; nothing was changed',
    );
    expect(writes(requests)).toEqual([]);
  });
});
