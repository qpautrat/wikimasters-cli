import { describe, expect, it } from "vitest";
import {
  AUTH_COOKIE_NAME,
  refreshTokenFromAuthCookieChunks,
  refreshTokenFromAuthCookies,
} from "./auth-cookie.js";
import { WikiMastersError } from "./errors.js";

const session = JSON.stringify({
  access_token: "access",
  refresh_token: "refresh-token",
  user: { id: "u" },
});
const encoded = `base64-${Buffer.from(session).toString("base64url")}`;

describe("refreshTokenFromAuthCookies", () => {
  it("reads a base64url-encoded session from a single cookie", () => {
    expect(
      refreshTokenFromAuthCookies([{ name: AUTH_COOKIE_NAME, value: encoded }]),
    ).toBe("refresh-token");
  });

  it("joins chunked cookies in index order", () => {
    const cookies = [
      { name: `${AUTH_COOKIE_NAME}.1`, value: encoded.slice(40) },
      { name: "__cf_bm", value: "unrelated" },
      { name: `${AUTH_COOKIE_NAME}.0`, value: encoded.slice(0, 40) },
    ];

    expect(refreshTokenFromAuthCookies(cookies)).toBe("refresh-token");
  });

  it("reads a raw URI-encoded session", () => {
    expect(
      refreshTokenFromAuthCookies([
        { name: AUTH_COOKIE_NAME, value: encodeURIComponent(session) },
      ]),
    ).toBe("refresh-token");
  });

  it("returns undefined when not signed in", () => {
    expect(
      refreshTokenFromAuthCookies([{ name: "__cf_bm", value: "x" }]),
    ).toBeUndefined();
  });

  it("rejects a truncated session", () => {
    expect(() =>
      refreshTokenFromAuthCookies([
        { name: `${AUTH_COOKIE_NAME}.0`, value: encoded.slice(0, 40) },
      ]),
    ).toThrow(WikiMastersError);
  });
});

describe("refreshTokenFromAuthCookieChunks", () => {
  it("joins the chunks in the given order", () => {
    expect(
      refreshTokenFromAuthCookieChunks([
        encoded.slice(0, 40),
        encoded.slice(40),
      ]),
    ).toBe("refresh-token");
  });

  it.each([
    ["an empty value", ""],
    ["text that is not a session", "not-a-session"],
    ["a session without refresh token", encodeURIComponent("{}")],
  ])("rejects %s without echoing it", (_, value) => {
    expect(() => refreshTokenFromAuthCookieChunks([value])).toThrow(
      `The ${AUTH_COOKIE_NAME} cookie holds no refresh token`,
    );
  });
});
