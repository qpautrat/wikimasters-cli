import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { refreshTokenFromAuthCookies } from './auth-cookie.js';
import { WikiMastersError } from './errors.js';
import { SITE_URL } from './supabase.js';

export interface BrowserLoginOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

function tryReadRefreshToken(cookies: Parameters<typeof refreshTokenFromAuthCookies>[0]): string | undefined {
  try {
    return refreshTokenFromAuthCookies(cookies);
  } catch {
    return undefined;
  }
}

export async function loginInBrowser({ timeoutMs = 5 * 60_000, pollIntervalMs = 500 }: BrowserLoginOptions = {}): Promise<string> {
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${SITE_URL}/login`);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (page.isClosed()) {
        throw new WikiMastersError('The login window was closed before signing in');
      }
      const refreshToken = tryReadRefreshToken(await context.cookies(SITE_URL));
      if (refreshToken) return refreshToken;
      await sleep(pollIntervalMs);
    }
    throw new WikiMastersError(`No sign-in within ${Math.round(timeoutMs / 1000)} s`);
  } finally {
    await browser.close();
  }
}
