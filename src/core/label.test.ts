import { describe, expect, it } from "vitest";
import { AuthRequiredError } from "./errors.js";
import { asLabelId, createLabel, deleteLabel, listLabels } from "./label.js";
import { resumeSession } from "./session.js";
import {
  ACCESS_TOKEN,
  USER_ID,
  fakeFetch,
  restRequest,
  restRoute,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

function existingLabel(...rows: { name: string; color: string }[]): Route {
  return restRoute("GET", "tags", {
    status: 200,
    body: rows.map((row, index) => ({ id: `label-${index}`, ...row })),
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

describe("listLabels", () => {
  it("lists the labels of the signed-in user with their id, name and colour in one request", async () => {
    const labels = [
      {
        id: "5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35",
        name: "Bauges 2000",
        color: "#16a34a",
      },
      {
        id: "a3e91d47-2f6b-4c8a-b5d0-7e1c9f3a2b64",
        name: "KC LOL 2026",
        color: "#1e40af",
      },
    ];
    const { session, requests } = await sessionWith(
      restRoute("GET", "tags", { status: 200, body: labels }),
    );

    await expect(listLabels(session)).resolves.toEqual(labels);
    const reads = requests.filter(restRequest("GET", "tags"));
    expect(reads).toHaveLength(1);
    expect(
      requests.filter(({ url }) => url.pathname.startsWith("/rest/")),
    ).toHaveLength(1);
    expect(reads[0]?.url.searchParams.get("select")).toBe("id,name,color");
    expect(reads[0]?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(reads[0]?.url.searchParams.get("order")).toBe("name.asc");
  });

  it("returns an empty list when the user has no label", async () => {
    const { session } = await sessionWith(existingLabel());

    await expect(listLabels(session)).resolves.toEqual([]);
  });

  it("reports the game's refusal with its reason", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "tags", {
        status: 400,
        body: { code: "PGRST100", message: "failed to parse filter" },
      }),
    );

    await expect(listLabels(session)).rejects.toThrow(
      "Reading your labels failed (HTTP 400): failed to parse filter",
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "tags", {
        status: 401,
        body: { code: "PGRST303", message: "JWT expired" },
      }),
    );

    await expect(listLabels(session)).rejects.toThrow(AuthRequiredError);
  });
});

describe("createLabel", () => {
  const created = {
    id: "5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35",
    name: "Karmine Corp",
    color: "#facc15",
  };

  it("creates a label of the signed-in user with the given colour in one request and returns it with its id", async () => {
    const { session, requests } = await sessionWith(
      restRoute("POST", "tags", { status: 201, body: created }),
    );

    await expect(
      createLabel(session, "Karmine Corp", "#facc15"),
    ).resolves.toEqual(created);
    const insert = requests.find(restRequest("POST", "tags"));
    expect(JSON.parse(insert?.body ?? "null")).toEqual({
      user_id: USER_ID,
      name: "Karmine Corp",
      color: "#facc15",
    });
    expect(insert?.url.searchParams.get("select")).toBe("id,name,color");
    expect(insert?.headers.get("prefer")).toContain("return=representation");
    expect(insert?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(
      requests.filter(({ url }) => url.pathname.startsWith("/rest/")),
    ).toHaveLength(1);
  });

  it("sends no colour without one", async () => {
    const { session, requests } = await sessionWith(
      restRoute("POST", "tags", {
        status: 201,
        body: { ...created, color: "#94a3b8" },
      }),
    );

    await expect(createLabel(session, "Karmine Corp")).resolves.toEqual({
      ...created,
      color: "#94a3b8",
    });
    const insert = requests.find(restRequest("POST", "tags"));
    expect(JSON.parse(insert?.body ?? "null")).toEqual({
      user_id: USER_ID,
      name: "Karmine Corp",
    });
  });

  it("reports the game's duplicate refusal without reading the labels", async () => {
    const { session, requests } = await sessionWith(
      restRoute("POST", "tags", {
        status: 409,
        body: {
          code: "23505",
          message:
            'duplicate key value violates unique constraint "tags_user_name_lower_unique"',
        },
      }),
    );

    await expect(createLabel(session, "Karmine Corp")).rejects.toThrow(
      'Creating label "Karmine Corp" failed (HTTP 409): duplicate key value violates unique constraint "tags_user_name_lower_unique"',
    );
    expect(
      requests.filter(({ url }) => url.pathname.startsWith("/rest/")),
    ).toHaveLength(1);
  });

  it("sends the name to the API as given", async () => {
    const { session, requests } = await sessionWith(
      restRoute("POST", "tags", {
        status: 201,
        body: { ...created, name: " montagne*" },
      }),
    );

    await createLabel(session, " montagne*");
    const insert = requests.find(restRequest("POST", "tags"));
    expect(JSON.parse(insert?.body ?? "null")).toMatchObject({
      name: " montagne*",
    });
  });

  it("reports the game's refusal with its reason", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "tags", {
        status: 400,
        body: {
          code: "23514",
          message:
            'new row for relation "tags" violates check constraint "tags_color_hex_check"',
        },
      }),
    );

    await expect(createLabel(session, "Karmine Corp", "jaune")).rejects.toThrow(
      'Creating label "Karmine Corp" failed (HTTP 400): new row for relation "tags" violates check constraint "tags_color_hex_check"',
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "tags", {
        status: 401,
        body: { code: "PGRST303", message: "JWT expired" },
      }),
    );

    await expect(createLabel(session, "Karmine Corp")).rejects.toThrow(
      AuthRequiredError,
    );
  });
});

describe("deleteLabel", () => {
  it("deletes the label of that id through delete_tag in a single request", async () => {
    const { session, requests } = await sessionWith(
      restRoute("POST", "rpc/delete_tag", { status: 204 }),
    );

    await expect(deleteLabel(session, asLabelId("label-id"))).resolves.toEqual({
      id: "label-id",
    });
    expect(
      requests.filter((request) => request.url.pathname.startsWith("/rest/")),
    ).toHaveLength(1);
    const call = requests.find(restRequest("POST", "rpc/delete_tag"));
    expect(JSON.parse(call?.body ?? "null")).toEqual({ p_tag_id: "label-id" });
    expect(call?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("reports the game's refusal with its reason", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "rpc/delete_tag", {
        status: 400,
        body: {
          code: "P0001",
          message: "Tag not found or not owned by caller",
        },
      }),
    );

    await expect(deleteLabel(session, asLabelId("label-id"))).rejects.toThrow(
      "Deleting label label-id failed (HTTP 400): Tag not found or not owned by caller",
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "rpc/delete_tag", {
        status: 401,
        body: { code: "PGRST303", message: "JWT expired" },
      }),
    );

    await expect(deleteLabel(session, asLabelId("label-id"))).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
