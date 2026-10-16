import { spawn } from "node:child_process";
import { createDecipheriv, createHash, pbkdf2Sync } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { setTimeout as sleep } from "node:timers/promises";
import {
  AUTH_COOKIE_NAME,
  refreshTokenFromAuthCookies,
  type Cookie,
} from "./auth-cookie.js";
import { WikiMastersError } from "./errors.js";
import { SITE_URL } from "./supabase.js";

export const FIREFOX_BINARY =
  "/Applications/Firefox.app/Contents/MacOS/firefox";

const FIREFOX_PREFS = [
  'user_pref("browser.shell.checkDefaultBrowser", false);',
  'user_pref("browser.aboutwelcome.enabled", false);',
  'user_pref("browser.startup.homepage_override.mstone", "ignore");',
  'user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);',
];

export const CHROME_BINARY =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Chromium crypto/apple/fake_keychain_v2.mm: with --use-mock-keychain, "mock_password" stands for the "Chrome Safe Storage" keychain entry; components/os_crypt/async/browser/keychain_key_provider.mm derives the key from it.
const CHROME_MOCK_KEYCHAIN_KEY = pbkdf2Sync(
  "mock_password",
  "saltysalt",
  1003,
  16,
  "sha1",
);

const LOGIN_URL = `${SITE_URL}/login`;

export interface BrowserLoginOptions {
  binary?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

interface Browser {
  name: string;
  binary: string;
  prepareLaunch(profileDir: string): string[];
  readRefreshToken(profileDir: string): string | undefined;
}

const FIREFOX: Browser = {
  name: "Firefox",
  binary: FIREFOX_BINARY,
  prepareLaunch(profileDir) {
    writeFileSync(join(profileDir, "user.js"), `${FIREFOX_PREFS.join("\n")}\n`);
    return ["--no-remote", "--profile", profileDir, LOGIN_URL];
  },
  readRefreshToken: readRefreshTokenFromFirefoxProfile,
};

const CHROME: Browser = {
  name: "Chrome",
  binary: CHROME_BINARY,
  prepareLaunch: (profileDir) => [
    `--user-data-dir=${profileDir}`,
    "--use-mock-keychain",
    "--no-first-run",
    "--no-default-browser-check",
    LOGIN_URL,
  ],
  readRefreshToken: readRefreshTokenFromChromeProfile,
};

function readCookieDatabase<T>(
  database: string,
  read: (db: DatabaseSync) => T,
): T | undefined {
  if (!existsSync(database)) return undefined;

  const snapshot = mkdtempSync(join(tmpdir(), "wikimasters-cookies-"));
  const copy = join(snapshot, basename(database));
  try {
    for (const suffix of ["", "-wal", "-journal"]) {
      if (existsSync(database + suffix))
        copyFileSync(database + suffix, copy + suffix);
    }
    const db = new DatabaseSync(copy);
    try {
      return read(db);
    } finally {
      db.close();
    }
  } catch {
    return undefined;
  } finally {
    rmSync(snapshot, { recursive: true, force: true });
  }
}

export function readRefreshTokenFromFirefoxProfile(
  profileDir: string,
): string | undefined {
  return readCookieDatabase(join(profileDir, "cookies.sqlite"), (db) => {
    const cookies: Cookie[] = db
      .prepare(
        "SELECT name, value FROM moz_cookies WHERE host LIKE '%wiki-masters.com' AND name LIKE ? || '%'",
      )
      .all(AUTH_COOKIE_NAME)
      .map(({ name, value }) => ({
        name: String(name),
        value: String(value),
      }));
    return refreshTokenFromAuthCookies(cookies);
  });
}

// Cookie encryption format: Chromium components/os_crypt/async/common/encryptor.cc.
function decryptChromeCookie(
  hostKey: string,
  encrypted: Uint8Array,
): string | undefined {
  const data = Buffer.from(encrypted);
  if (data.subarray(0, 3).toString("latin1") !== "v10") return undefined;
  const decipher = createDecipheriv(
    "aes-128-cbc",
    CHROME_MOCK_KEYCHAIN_KEY,
    Buffer.alloc(16, " "),
  );
  const plain = Buffer.concat([
    decipher.update(data.subarray(3)),
    decipher.final(),
  ]);
  // Chromium net/extras/sqlite/sqlite_persistent_cookie_store.cc: from database version 24, the value follows the SHA-256 of the cookie's domain.
  const domainHash = createHash("sha256").update(hostKey).digest();
  return (
    plain.subarray(0, domainHash.length).equals(domainHash)
      ? plain.subarray(domainHash.length)
      : plain
  ).toString("utf8");
}

export function readRefreshTokenFromChromeProfile(
  profileDir: string,
): string | undefined {
  return readCookieDatabase(join(profileDir, "Default", "Cookies"), (db) => {
    const cookies: Cookie[] = db
      .prepare(
        "SELECT host_key, name, encrypted_value FROM cookies WHERE host_key LIKE '%wiki-masters.com' AND name LIKE ? || '%'",
      )
      .all(AUTH_COOKIE_NAME)
      .flatMap(({ host_key, name, encrypted_value }) => {
        const value =
          encrypted_value instanceof Uint8Array
            ? decryptChromeCookie(String(host_key), encrypted_value)
            : undefined;
        return value === undefined ? [] : [{ name: String(name), value }];
      });
    return refreshTokenFromAuthCookies(cookies);
  });
}

async function loginInBrowser(
  browser: Browser,
  {
    binary = browser.binary,
    timeoutMs = 5 * 60_000,
    pollIntervalMs = 1000,
  }: BrowserLoginOptions,
): Promise<string> {
  const profileDir = mkdtempSync(
    join(tmpdir(), `wikimasters-${browser.name.toLowerCase()}-`),
  );

  const child = spawn(binary, browser.prepareLaunch(profileDir), {
    stdio: "ignore",
  });
  let exited = false;
  const exit = new Promise<void>((resolve) =>
    child.once("close", () => resolve()),
  );
  void exit.then(() => (exited = true));
  const launchFailure = new Promise<never>((_, reject) =>
    child.once("error", (error) =>
      reject(
        new WikiMastersError(
          `Cannot start ${browser.name} at ${binary}: ${error.message}`,
        ),
      ),
    ),
  );

  try {
    return await Promise.race([launchFailure, pollForSession()]);
  } finally {
    if (!exited) child.kill();
    await exit;
    rmSync(profileDir, { recursive: true, force: true });
  }

  async function pollForSession(): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const closed = exited;
      const refreshToken = browser.readRefreshToken(profileDir);
      if (refreshToken) return refreshToken;
      if (closed)
        throw new WikiMastersError(
          `${browser.name} was closed before signing in`,
        );
      await sleep(pollIntervalMs);
    }
    throw new WikiMastersError(
      `No sign-in within ${Math.round(timeoutMs / 1000)} s`,
    );
  }
}

export function loginInFirefox(
  options: BrowserLoginOptions = {},
): Promise<string> {
  return loginInBrowser(FIREFOX, options);
}

export function loginInChrome(
  options: BrowserLoginOptions = {},
): Promise<string> {
  return loginInBrowser(CHROME, options);
}
