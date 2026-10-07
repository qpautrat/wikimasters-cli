import {
  createClient,
  isAuthApiError,
  isAuthRetryableFetchError,
  type SupabaseClient,
} from "@supabase/supabase-js";
import {
  AuthRequiredError,
  WikiMastersError,
  apiUnavailable,
} from "./errors.js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase.js";
import {
  RETRY_DELAYS_MS,
  fetchRetrying,
  isTransientStatus,
} from "./transient.js";

const SESSION_REJECTED_STATUSES = new Set([400, 401, 403]);
const AUTH_PATH = "/auth/v1/";
const INVALID_API_KEY = "Invalid API key";

export interface ResumeSessionOptions {
  anonKey?: string | undefined;
  refreshToken: string;
  fetch?: typeof fetch;
  retryDelaysMs?: readonly number[];
}

export interface Session {
  client: SupabaseClient;
  userId: string;
  refreshToken: string;
  fetch: typeof fetch;
  retryDelaysMs: readonly number[];
}

function requestUrl(input: string | URL | Request): URL {
  return new URL(input instanceof Request ? input.url : input);
}

export async function resumeSession({
  anonKey = SUPABASE_ANON_KEY,
  refreshToken,
  fetch = globalThis.fetch,
  retryDelaysMs = RETRY_DELAYS_MS,
}: ResumeSessionOptions): Promise<Session> {
  const supabaseFetch: typeof globalThis.fetch = (input, init) =>
    requestUrl(input).pathname.startsWith(AUTH_PATH)
      ? fetch(input, init)
      : fetchRetrying(fetch, retryDelaysMs, isTransientStatus, input, init);

  const client = createClient(SUPABASE_URL, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { retry: false },
    global: { fetch: supabaseFetch },
  });

  const { data, error } = await client.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error) {
    if (isAuthRetryableFetchError(error) && isTransientStatus(error.status)) {
      throw apiUnavailable(error.status);
    }
    if (isAuthApiError(error) && error.message === INVALID_API_KEY) {
      throw new WikiMastersError(
        `Supabase rejected the site's public key (${error.message}); the site may have changed it`,
      );
    }
    throw isAuthApiError(error) && SESSION_REJECTED_STATUSES.has(error.status)
      ? new AuthRequiredError(
          `The stored session is expired or revoked (${error.message})`,
        )
      : new WikiMastersError(`Resuming the session failed: ${error.message}`);
  }
  if (!data.session || !data.user) {
    throw new WikiMastersError("Resuming the session returned no session");
  }

  return {
    client,
    userId: data.user.id,
    refreshToken: data.session.refresh_token,
    fetch,
    retryDelaysMs,
  };
}
