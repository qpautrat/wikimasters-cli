import { describe, expect, it } from "vitest";
import { AuthRequiredError } from "./errors.js";
import { createLabel, deleteLabel } from "./label.js";
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

const duplicate = restRoute("POST", "tags", {
  status: 409,
  body: {
    code: "23505",
    message: "duplicate key value violates unique constraint",
  },
});

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

describe("createLabel", () => {
  it("creates a label of the signed-in user with the given colour", async () => {
    const { session, requests } = await sessionWith(
      restRoute("POST", "tags", {
        status: 201,
        body: { name: "Karmine Corp", color: "#facc15" },
      }),
    );

    await expect(
      createLabel(session, "Karmine Corp", "#facc15"),
    ).resolves.toEqual({
      name: "Karmine Corp",
      color: "#facc15",
      created: true,
    });
    const insert = requests.find(restRequest("POST", "tags"));
    expect(JSON.parse(insert?.body ?? "null")).toEqual({
      user_id: USER_ID,
      name: "Karmine Corp",
      color: "#facc15",
    });
    expect(insert?.url.searchParams.get("select")).toBe("name,color");
    expect(insert?.headers.get("prefer")).toContain("return=representation");
    expect(insert?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("sends no colour without one", async () => {
    const { session, requests } = await sessionWith(
      restRoute("POST", "tags", {
        status: 201,
        body: { name: "Karmine Corp", color: "#94a3b8" },
      }),
    );

    await expect(createLabel(session, "Karmine Corp")).resolves.toEqual({
      name: "Karmine Corp",
      color: "#94a3b8",
      created: true,
    });
    const insert = requests.find(restRequest("POST", "tags"));
    expect(JSON.parse(insert?.body ?? "null")).toEqual({
      user_id: USER_ID,
      name: "Karmine Corp",
    });
  });

  it("succeeds without creating when the user already has a label of that name", async () => {
    const { session, requests } = await sessionWith(
      duplicate,
      existingLabel({ name: "Karmine Corp", color: "#818cf8" }),
    );

    await expect(
      createLabel(session, "Karmine Corp", "#facc15"),
    ).resolves.toEqual({
      name: "Karmine Corp",
      color: "#818cf8",
      created: false,
    });
    const read = requests.find(restRequest("GET", "tags"));
    expect(read?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
  });

  it("reports the label the game deems the same name regardless of case", async () => {
    const { session, requests } = await sessionWith(
      duplicate,
      existingLabel(
        { name: "E-sport", color: "#5eead4" },
        { name: "Karmine Corp", color: "#94a3b8" },
      ),
    );

    await expect(createLabel(session, "karmine corp")).resolves.toEqual({
      name: "Karmine Corp",
      color: "#94a3b8",
      created: false,
    });
    expect(requests.filter(restRequest("POST", "tags"))).toHaveLength(1);
  });

  it("reports a duplicate refusal it cannot match to any of the labels", async () => {
    const { session } = await sessionWith(
      duplicate,
      existingLabel({ name: "E-sport", color: "#5eead4" }),
    );

    await expect(createLabel(session, "Karmine Corp")).rejects.toThrow(
      'The game refused label "Karmine Corp" as a duplicate, yet none of your labels has that name regardless of case; nothing was created',
    );
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
  function labelNamed(...ids: string[]): Route {
    return restRoute("GET", "tags", {
      status: 200,
      body: ids.map((id) => ({ id })),
    });
  }

  it("deletes the label of that name through delete_tag", async () => {
    const { session, requests } = await sessionWith(
      labelNamed("label-id"),
      restRoute("POST", "rpc/delete_tag", { status: 204 }),
    );

    await expect(deleteLabel(session, "Test CLI")).resolves.toEqual({
      name: "Test CLI",
      deleted: true,
    });
    const read = requests.find(restRequest("GET", "tags"));
    expect(read?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(read?.url.searchParams.get("name")).toBe("eq.Test CLI");
    const call = requests.find(restRequest("POST", "rpc/delete_tag"));
    expect(JSON.parse(call?.body ?? "null")).toEqual({ p_tag_id: "label-id" });
    expect(call?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("sends the name to the API as given", async () => {
    const { session, requests } = await sessionWith(labelNamed());

    await deleteLabel(session, " montagne*");
    const read = requests.find(restRequest("GET", "tags"));
    expect(read?.url.searchParams.get("name")).toBe("eq. montagne*");
  });

  it("succeeds without deleting when the user has no label of that name", async () => {
    const { session, requests } = await sessionWith(labelNamed());

    await expect(deleteLabel(session, "Karmine Corp")).resolves.toEqual({
      name: "Karmine Corp",
      deleted: false,
    });
    expect(requests.filter(restRequest("POST", "rpc/delete_tag"))).toEqual([]);
  });

  it("reports the game's refusal with its reason", async () => {
    const { session } = await sessionWith(
      labelNamed("label-id"),
      restRoute("POST", "rpc/delete_tag", {
        status: 400,
        body: {
          code: "P0001",
          message: "Tag not found or not owned by caller",
        },
      }),
    );

    await expect(deleteLabel(session, "Test CLI")).rejects.toThrow(
      'Deleting label "Test CLI" failed (HTTP 400): Tag not found or not owned by caller',
    );
  });

  it("reports a failed read of the label as a read", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "tags", {
        status: 400,
        body: { code: "PGRST100", message: "failed to parse filter" },
      }),
    );

    await expect(deleteLabel(session, "Test CLI")).rejects.toThrow(
      'Reading label "Test CLI" failed (HTTP 400): failed to parse filter',
    );
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionWith(
      labelNamed("label-id"),
      restRoute("POST", "rpc/delete_tag", {
        status: 401,
        body: { code: "PGRST303", message: "JWT expired" },
      }),
    );

    await expect(deleteLabel(session, "Test CLI")).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
