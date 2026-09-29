import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig, requireRefreshToken, saveRefreshToken } from './config.js';

function envFile(content?: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'wkm-')), '.env');
  if (content !== undefined) writeFileSync(path, content);
  return path;
}

describe('loadConfig', () => {
  it('reads the anon key and refresh token from the env file', () => {
    const path = envFile('WKM_SUPABASE_ANON_KEY=anon-key\nWKM_REFRESH_TOKEN=stored-token\n');

    expect(loadConfig(path, {})).toEqual({ anonKey: 'anon-key', refreshToken: 'stored-token' });
  });

  it('prefers the env file, which holds the latest rotated token, over the environment', () => {
    const path = envFile('WKM_SUPABASE_ANON_KEY=anon-key\nWKM_REFRESH_TOKEN=rotated\n');

    expect(loadConfig(path, { WKM_REFRESH_TOKEN: 'stale' }).refreshToken).toBe('rotated');
  });

  it('falls back to the environment', () => {
    expect(loadConfig(envFile(), { WKM_SUPABASE_ANON_KEY: 'anon-key' }).anonKey).toBe('anon-key');
  });

  it('names the missing anon key', () => {
    expect(() => loadConfig(envFile(), {})).toThrow(/WKM_SUPABASE_ANON_KEY/);
  });

  it('asks to log in when no refresh token is stored', () => {
    expect(() => requireRefreshToken({ anonKey: 'anon-key', refreshToken: undefined })).toThrow(/wkm login/);
  });
});

describe('saveRefreshToken', () => {
  it('replaces the stored token and keeps the other lines', () => {
    const path = envFile('WKM_SUPABASE_ANON_KEY=anon-key\nWKM_REFRESH_TOKEN=old\n');

    saveRefreshToken('new', path);

    expect(readFileSync(path, 'utf8')).toBe('WKM_SUPABASE_ANON_KEY=anon-key\nWKM_REFRESH_TOKEN=new\n');
  });

  it('appends the token when absent and restricts the file to its owner', () => {
    const path = envFile('WKM_SUPABASE_ANON_KEY=anon-key\n');

    saveRefreshToken('new', path);

    expect(readFileSync(path, 'utf8')).toBe('WKM_SUPABASE_ANON_KEY=anon-key\nWKM_REFRESH_TOKEN=new\n');
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });
});
