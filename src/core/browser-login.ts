import { spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

const COOKIES_DB = "cookies.sqlite";

const PROFILE_PREFS = [
  'user_pref("browser.shell.checkDefaultBrowser", false);',
  'user_pref("browser.aboutwelcome.enabled", false);',
  'user_pref("browser.startup.homepage_override.mstone", "ignore");',
  'user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);',
];

export interface BrowserLoginOptions {
  firefoxBinary?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export function readRefreshTokenFromFirefoxProfile(
  profileDir: string,
): string | undefined {
  const database = join(profileDir, COOKIES_DB);
  if (!existsSync(database)) return undefined;

  const snapshot = mkdtempSync(join(tmpdir(), "wikimasters-cookies-"));
  try {
    for (const suffix of ["", "-wal"]) {
      if (existsSync(database + suffix))
        copyFileSync(database + suffix, join(snapshot, COOKIES_DB + suffix));
    }
    const db = new DatabaseSync(join(snapshot, COOKIES_DB));
    try {
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
    } finally {
      db.close();
    }
  } catch {
    return undefined;
  } finally {
    rmSync(snapshot, { recursive: true, force: true });
  }
}

export async function loginInBrowser({
  firefoxBinary = FIREFOX_BINARY,
  timeoutMs = 5 * 60_000,
  pollIntervalMs = 1000,
}: BrowserLoginOptions = {}): Promise<string> {
  const profileDir = mkdtempSync(join(tmpdir(), "wikimasters-firefox-"));
  writeFileSync(join(profileDir, "user.js"), `${PROFILE_PREFS.join("\n")}\n`);

  const firefox = spawn(
    firefoxBinary,
    ["--no-remote", "--profile", profileDir, `${SITE_URL}/login`],
    { stdio: "ignore" },
  );
  let exited = false;
  const exit = new Promise<void>((resolve) =>
    firefox.once("close", () => resolve()),
  );
  void exit.then(() => (exited = true));
  const launchFailure = new Promise<never>((_, reject) =>
    firefox.once("error", (error) =>
      reject(
        new WikiMastersError(
          `Cannot start Firefox at ${firefoxBinary}: ${error.message}`,
        ),
      ),
    ),
  );

  try {
    return await Promise.race([launchFailure, pollForSession()]);
  } finally {
    if (!exited) firefox.kill();
    await exit;
    rmSync(profileDir, { recursive: true, force: true });
  }

  async function pollForSession(): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const closed = exited;
      const refreshToken = readRefreshTokenFromFirefoxProfile(profileDir);
      if (refreshToken) return refreshToken;
      if (closed)
        throw new WikiMastersError("Firefox was closed before signing in");
      await sleep(pollIntervalMs);
    }
    throw new WikiMastersError(
      `No sign-in within ${Math.round(timeoutMs / 1000)} s`,
    );
  }
}
