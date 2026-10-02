import {
  createClient,
  isAuthApiError,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { SUPABASE_URL } from "./supabase.js";

const SESSION_REJECTED_STATUSES = new Set([400, 401, 403]);

export interface ResumeSessionOptions {
  anonKey: string;
  refreshToken: string;
  fetch?: typeof fetch;
}

export interface Session {
  client: SupabaseClient;
  userId: string;
  refreshToken: string;
  fetch: typeof fetch;
}

export async function resumeSession({
  anonKey,
  refreshToken,
  fetch,
}: ResumeSessionOptions): Promise<Session> {
  const client = createClient(SUPABASE_URL, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(fetch ? { global: { fetch } } : {}),
  });

  const { data, error } = await client.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error) {
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
    fetch: fetch ?? globalThis.fetch,
  };
}
