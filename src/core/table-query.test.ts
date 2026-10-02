import { describe, expect, it } from "vitest";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import { queryTable } from "./table-query.js";
import {
  ACCESS_TOKEN,
  fakeFetch,
  tokenRefresh,
  type FakeResponse,
} from "./testing/fake-supabase.js";

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ({ url }) =>
    url.pathname.startsWith("/rest/v1/") ? response : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

describe("queryTable", () => {
  it("sends the query as a GET on the table with the session", async () => {
    const rows = [{ card_id: "c1", count: 1 }];
    const { session, requests } = await sessionAnswering({
      status: 200,
      body: rows,
    });

    await expect(
      queryTable(session, "user_cards?select=card_id,count&count=gt.0&limit=1"),
    ).resolves.toEqual(rows);

    const request = requests.at(-1);
    expect(request?.method).toBe("GET");
    expect(request?.url.pathname).toBe("/rest/v1/user_cards");
    expect(request?.url.searchParams.get("select")).toBe("card_id,count");
    expect(request?.url.searchParams.get("count")).toBe("gt.0");
    expect(request?.url.searchParams.get("limit")).toBe("1");
    expect(request?.headers.get("authorization")).toBe(
      `Bearer ${ACCESS_TOKEN}`,
    );
  });

  it("selects every column when the query names none", async () => {
    const { session, requests } = await sessionAnswering({
      status: 200,
      body: [],
    });

    await queryTable(session, "cards");

    expect(requests.at(-1)?.url.searchParams.get("select")).toBe("*");
  });

  it("refuses a table name that would leave the table path", async () => {
    const { session, requests } = await sessionAnswering({
      status: 200,
      body: [],
    });

    await expect(
      queryTable(session, "../auth/v1/user?select=*"),
    ).rejects.toThrow(WikiMastersError);
    expect(
      requests.some(({ url }) => url.pathname.includes("/auth/v1/user")),
    ).toBe(false);
  });

  it("reports PostgREST's hint for an unknown table", async () => {
    const { session } = await sessionAnswering({
      status: 404,
      body: {
        code: "PGRST205",
        message: "Could not find the table 'public.collection'",
        hint: "Perhaps you meant the table 'public.user_cards'",
      },
    });

    await expect(queryTable(session, "collection")).rejects.toThrow(
      /HTTP 404.*Perhaps you meant the table 'public.user_cards'/,
    );
  });

  it("reports PostgREST's details for an unknown relation", async () => {
    const { session } = await sessionAnswering({
      status: 400,
      body: {
        code: "PGRST200",
        message:
          "Could not find a relationship between 'cards' and 'user_card'",
        details: "Searched for a foreign key relationship",
        hint: null,
      },
    });

    await expect(
      queryTable(session, "cards?select=id,user_card(card_id)"),
    ).rejects.toThrow(/user_card'.*Searched for a foreign key relationship/);
  });

  it("requires a new login when the API rejects the session", async () => {
    const { session } = await sessionAnswering({
      status: 401,
      body: { code: "PGRST303", message: "JWT expired" },
    });

    await expect(queryTable(session, "cards")).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
