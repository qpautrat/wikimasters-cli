import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSignInOptions } from './config.js';

function envFile(content: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'wkm-')), '.env');
  writeFileSync(path, content);
  return path;
}

describe('loadSignInOptions', () => {
  it('reads credentials from the env file', () => {
    const path = envFile('WKM_EMAIL=player@example.test\nWKM_PASSWORD=secret\nWKM_SUPABASE_ANON_KEY=anon-key\n');

    expect(loadSignInOptions({}, path)).toEqual({
      anonKey: 'anon-key',
      credentials: { email: 'player@example.test', password: 'secret' },
    });
  });

  it('lets environment variables override the env file', () => {
    const path = envFile('WKM_EMAIL=file@example.test\nWKM_PASSWORD=secret\nWKM_SUPABASE_ANON_KEY=anon-key\n');

    expect(loadSignInOptions({ WKM_EMAIL: 'env@example.test' }, path).credentials.email).toBe('env@example.test');
  });

  it('names the missing variable', () => {
    expect(() => loadSignInOptions({}, join(tmpdir(), 'missing.env'))).toThrow(/WKM_SUPABASE_ANON_KEY/);
  });
});
