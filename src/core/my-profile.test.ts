import { describe, expect, it } from "vitest";
import { AuthRequiredError } from "./errors.js";
import { readMyProfile } from "./my-profile.js";
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

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

describe("readMyProfile", () => {
  it("returns the profile get_my_profile answers, as given, in a single request", async () => {
    const profile = {
      id: USER_ID,
      username: "Joueur",
      wikibidous_balance: 7989,
      avatar_url: null,
      ban_words: [],
    };
    const { session, requests } = await sessionWith(
      restRoute("POST", "rpc/get_my_profile", { status: 200, body: profile }),
    );

    await expect(readMyProfile(session)).resolves.toEqual(profile);
    expect(
      requests.filter(({ url }) => url.pathname.startsWith("/rest/")),
    ).toHaveLength(1);
    const call = requests.find(restRequest("POST", "rpc/get_my_profile"));
    expect(call?.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("fails on a response that is not an object", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "rpc/get_my_profile", { status: 200, body: [] }),
    );

    await expect(readMyProfile(session)).rejects.toThrow(
      "Reading your profile returned an unexpected response: []",
    );
  });

  it("reports the API's refusal with its reason", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "rpc/get_my_profile", {
        status: 400,
        body: { code: "P0001", message: "Profile not found" },
      }),
    );

    await expect(readMyProfile(session)).rejects.toThrow(
      "Reading your profile failed (HTTP 400): Profile not found",
    );
  });

  it("asks to sign in again when the API rejects the session", async () => {
    const { session } = await sessionWith(
      restRoute("POST", "rpc/get_my_profile", {
        status: 401,
        body: { message: "JWT expired" },
      }),
    );

    await expect(readMyProfile(session)).rejects.toBeInstanceOf(
      AuthRequiredError,
    );
  });
});
