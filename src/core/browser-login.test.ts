import { createCipheriv, createHash, pbkdf2Sync } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import {
  CHROME_BINARY,
  loginInChrome,
  readRefreshTokenFromChromeProfile,
  readRefreshTokenFromFirefoxProfile,
} from "./browser-login.js";

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

function encryptChromeCookie(hostKey: string, value: string): Buffer {
  const key = pbkdf2Sync("mock_password", "saltysalt", 1003, 16, "sha1");
  const cipher = createCipheriv("aes-128-cbc", key, Buffer.alloc(16, " "));
  const plain = Buffer.concat([
    createHash("sha256").update(hostKey).digest(),
    Buffer.from(value),
  ]);
  return Buffer.concat([
    Buffer.from("v10"),
    cipher.update(plain),
    cipher.final(),
  ]);
}

const CREATE_CHROME_COOKIES =
  "CREATE TABLE cookies (host_key TEXT, name TEXT, value TEXT, encrypted_value BLOB)";
const INSERT_CHROME_COOKIE = "INSERT INTO cookies VALUES (?, ?, '', ?)";

function writeChromeCookies(
  profileDir: string,
  rows: Array<[hostKey: string, name: string, value: string]>,
): void {
  mkdirSync(join(profileDir, "Default"), { recursive: true });
  const db = new DatabaseSync(join(profileDir, "Default", "Cookies"));
  db.exec(CREATE_CHROME_COOKIES);
  const insert = db.prepare(INSERT_CHROME_COOKIE);
  for (const [hostKey, name, value] of rows)
    insert.run(hostKey, name, encryptChromeCookie(hostKey, value));
  db.close();
}

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "wikimasters-profile-"));
}

describe("readRefreshTokenFromChromeProfile", () => {
  it("decrypts the chunked auth cookie of the site", () => {
    const profileDir = tempDir();
    writeChromeCookies(profileDir, [
      ["www.wiki-masters.com", `${AUTH_COOKIE_NAME}.0`, session.slice(0, 20)],
      ["www.wiki-masters.com", `${AUTH_COOKIE_NAME}.1`, session.slice(20)],
      ["example.com", AUTH_COOKIE_NAME, "unrelated"],
    ]);

    expect(readRefreshTokenFromChromeProfile(profileDir)).toBe("refresh-token");
  });

  it("returns undefined before sign-in", () => {
    const profileDir = tempDir();
    writeChromeCookies(profileDir, [["www.wiki-masters.com", "__cf_bm", "x"]]);

    expect(readRefreshTokenFromChromeProfile(profileDir)).toBeUndefined();
  });

  it("returns undefined while the profile has no cookie database", () => {
    expect(readRefreshTokenFromChromeProfile(tempDir())).toBeUndefined();
  });
});

function chromeProfiles(): string[] {
  return readdirSync(tmpdir()).filter((entry) =>
    entry.startsWith("wikimasters-chrome-"),
  );
}

function fakeBrowser(script: string): string {
  const dir = tempDir();
  const scriptPath = join(dir, "browser.mjs");
  writeFileSync(scriptPath, script);
  const binary = join(dir, "browser");
  writeFileSync(
    binary,
    `#!/bin/sh\nexec "${process.execPath}" "${scriptPath}" "$@"\n`,
  );
  chmodSync(binary, 0o755);
  return binary;
}

describe("loginInChrome", () => {
  it("launches Chrome from /Applications/Google Chrome.app", () => {
    expect(CHROME_BINARY).toContain("/Applications/Google Chrome.app/");
  });

  it("names the binary when Chrome does not start", async () => {
    await expect(
      loginInChrome({ binary: "/nonexistent/Google Chrome" }),
    ).rejects.toThrow("Cannot start Chrome at /nonexistent/Google Chrome");
  });

  it("closes Chrome and deletes the profile once the session shows up", async () => {
    const before = chromeProfiles();
    const binary = fakeBrowser(`
      import { mkdirSync } from "node:fs";
      import { join } from "node:path";
      import { DatabaseSync } from "node:sqlite";
      const profileDir = process.argv
        .find((argument) => argument.startsWith("--user-data-dir="))
        .slice("--user-data-dir=".length);
      mkdirSync(join(profileDir, "Default"));
      const db = new DatabaseSync(join(profileDir, "Default", "Cookies"));
      db.exec(${JSON.stringify(CREATE_CHROME_COOKIES)});
      db.prepare(${JSON.stringify(INSERT_CHROME_COOKIE)}).run(
        "www.wiki-masters.com",
        ${JSON.stringify(AUTH_COOKIE_NAME)},
        Buffer.from(${JSON.stringify(encryptChromeCookie("www.wiki-masters.com", session).toString("base64"))}, "base64"),
      );
      db.close();
      setInterval(() => {}, 1000);
    `);

    expect(await loginInChrome({ binary, pollIntervalMs: 10 })).toBe(
      "refresh-token",
    );
    expect(chromeProfiles()).toEqual(before);
  });

  it("fails and deletes the profile when Chrome is closed before signing in", async () => {
    const before = chromeProfiles();

    await expect(
      loginInChrome({ binary: fakeBrowser(""), pollIntervalMs: 10 }),
    ).rejects.toThrow("Chrome was closed before signing in");
    expect(chromeProfiles()).toEqual(before);
  });

  it("fails and deletes the profile without sign-in before the timeout", async () => {
    const before = chromeProfiles();

    await expect(
      loginInChrome({
        binary: fakeBrowser("setInterval(() => {}, 1000);"),
        timeoutMs: 50,
        pollIntervalMs: 10,
      }),
    ).rejects.toThrow("No sign-in within");
    expect(chromeProfiles()).toEqual(before);
  });
});
