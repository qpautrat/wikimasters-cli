import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { readRefreshTokenFromFirefoxProfile } from "./browser-login.js";

const session = `base64-${Buffer.from(JSON.stringify({ refresh_token: "refresh-token" })).toString("base64url")}`;

function profileWithCookies(
  rows: Array<[host: string, name: string, value: string]>,
): string {
  const profileDir = mkdtempSync(join(tmpdir(), "wikimasters-profile-"));
  const inserts = rows
    .map(
      ([host, name, value]) =>
        `INSERT INTO moz_cookies VALUES ('${host}', '${name}', '${value}');`,
    )
    .join("");
  execFileSync("sqlite3", [
    join(profileDir, "cookies.sqlite"),
    `CREATE TABLE moz_cookies (host TEXT, name TEXT, value TEXT);${inserts}`,
  ]);
  return profileDir;
}

describe("readRefreshTokenFromFirefoxProfile", () => {
  it("reads the chunked auth cookie of the site", async () => {
    const profileDir = profileWithCookies([
      ["www.wiki-masters.com", `${AUTH_COOKIE_NAME}.0`, session.slice(0, 20)],
      ["www.wiki-masters.com", `${AUTH_COOKIE_NAME}.1`, session.slice(20)],
      ["example.com", AUTH_COOKIE_NAME, "unrelated"],
    ]);

    await expect(readRefreshTokenFromFirefoxProfile(profileDir)).resolves.toBe(
      "refresh-token",
    );
  });

  it("returns undefined before sign-in", async () => {
    const profileDir = profileWithCookies([
      ["www.wiki-masters.com", "__cf_bm", "x"],
    ]);

    await expect(
      readRefreshTokenFromFirefoxProfile(profileDir),
    ).resolves.toBeUndefined();
  });

  it("returns undefined while the profile has no cookie database", async () => {
    await expect(
      readRefreshTokenFromFirefoxProfile(
        mkdtempSync(join(tmpdir(), "wikimasters-profile-")),
      ),
    ).resolves.toBeUndefined();
  });
});
