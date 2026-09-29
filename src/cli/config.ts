import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { WikiMastersError, type SignInOptions } from '../core/index.js';

export const DEFAULT_ENV_FILE = fileURLToPath(new URL('../../.env', import.meta.url));

type Env = Record<string, string | undefined>;

function readEnvFile(path: string): Env {
  return existsSync(path) ? parseEnv(readFileSync(path, 'utf8')) : {};
}

export function loadSignInOptions(env: Env = process.env, envFile = DEFAULT_ENV_FILE): SignInOptions {
  const merged: Env = { ...readEnvFile(envFile), ...env };
  const required = (name: string): string => {
    const value = merged[name];
    if (!value) {
      throw new WikiMastersError(`Missing ${name}: set it in ${envFile} or in the environment`);
    }
    return value;
  };

  return {
    anonKey: required('WKM_SUPABASE_ANON_KEY'),
    credentials: { email: required('WKM_EMAIL'), password: required('WKM_PASSWORD') },
  };
}
