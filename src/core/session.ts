import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { WikiMastersError } from './errors.js';

export const SUPABASE_URL = 'https://cyrxjeppjqsxxjayfrur.supabase.co';

export interface Credentials {
  email: string;
  password: string;
}

export interface SignInOptions {
  anonKey: string;
  credentials: Credentials;
  fetch?: typeof fetch;
}

export interface Session {
  client: SupabaseClient;
  userId: string;
}

export async function signIn({ anonKey, credentials, fetch }: SignInOptions): Promise<Session> {
  const client = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(fetch ? { global: { fetch } } : {}),
  });

  const { data, error } = await client.auth.signInWithPassword(credentials);
  if (error) {
    throw new WikiMastersError(`Sign-in failed: ${error.message}`);
  }

  return { client, userId: data.user.id };
}
