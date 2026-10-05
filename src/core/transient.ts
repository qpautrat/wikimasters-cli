import { setTimeout as sleep } from "node:timers/promises";

// Cloudflare 52x meanings: https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/
const TRANSIENT_STATUSES = new Map<number, string>([
  [502, "bad gateway"],
  [503, "service unavailable"],
  [504, "gateway timeout"],
  [520, "web server returned an unknown error"],
  [521, "web server is down"],
  [522, "connection timed out"],
  [523, "origin is unreachable"],
  [524, "a timeout occurred"],
  [525, "SSL handshake failed"],
  [526, "invalid SSL certificate"],
]);

// Cloudflare answers these before forwarding the request to the origin.
const UNDELIVERED_STATUSES = new Set([521, 522, 523, 525, 526]);

export const RETRY_DELAYS_MS: readonly number[] = [1_000, 2_000, 4_000];

export type RetryCondition = (status: number) => boolean;

export function isTransientStatus(status: number): boolean {
  return TRANSIENT_STATUSES.has(status);
}

export function isUndeliveredStatus(status: number): boolean {
  return UNDELIVERED_STATUSES.has(status);
}

export function isPossiblyDeliveredStatus(status: number): boolean {
  return isTransientStatus(status) && !isUndeliveredStatus(status);
}

export function describeTransientStatus(status: number): string {
  return TRANSIENT_STATUSES.get(status) ?? "server error";
}

export async function fetchRetrying(
  fetch: typeof globalThis.fetch,
  delaysMs: readonly number[],
  retryOn: RetryCondition,
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  for (const delayMs of delaysMs) {
    const response = await fetch(input, init);
    if (!retryOn(response.status)) return response;
    await response.body?.cancel();
    await sleep(delayMs);
  }
  return fetch(input, init);
}
