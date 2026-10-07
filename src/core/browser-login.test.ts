import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { readRefreshTokenFromFirefoxProfile } from "./browser-login.js";

const session = `base64-${Buffer.from(JSON.stringify({ refresh_token: "refresh-token" })).toString("base64url")}`;

function profileWithCookies(
  rows: Array<[host: string, name: string, value: string]>,
): string {
  const profileDir = mkdtempSync(join(tmpdir(), "wikimasters-profile-"));
  const db = new DatabaseSync(join(profileDir, "cookies.sqlite"));
  db.exec("CREATE TABLE moz_cookies (host TEXT, name TEXT, value TEXT)");
  const insert = db.prepare("INSERT INTO moz_cookies VALUES (?, ?, ?)");
  for (const row of rows) insert.run(...row);
  db.close();
  return profileDir;
}

describe("readRefreshTokenFromFirefoxProfile", () => {
  it("reads the chunked auth cookie of the site", () => {
    const profileDir = profileWithCookies([
      ["www.wiki-masters.com", `${AUTH_COOKIE_NAME}.0`, session.slice(0, 20)],
      ["www.wiki-masters.com", `${AUTH_COOKIE_NAME}.1`, session.slice(20)],
      ["example.com", AUTH_COOKIE_NAME, "unrelated"],
    ]);

    expect(readRefreshTokenFromFirefoxProfile(profileDir)).toBe(
      "refresh-token",
    );
  });

  it("returns undefined before sign-in", () => {
    const profileDir = profileWithCookies([
      ["www.wiki-masters.com", "__cf_bm", "x"],
    ]);

    expect(readRefreshTokenFromFirefoxProfile(profileDir)).toBeUndefined();
  });

  it("returns undefined while the profile has no cookie database", () => {
    expect(
      readRefreshTokenFromFirefoxProfile(
        mkdtempSync(join(tmpdir(), "wikimasters-profile-")),
      ),
    ).toBeUndefined();
  });
});
