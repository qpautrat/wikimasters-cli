import { describe, expect, it } from 'vitest';
import { WikiMastersError } from './errors.js';
import { resumeSession } from './session.js';
import { ROTATED_REFRESH_TOKEN, USER_ID, fakeFetch, tokenRefresh } from './testing/fake-supabase.js';

describe('resumeSession', () => {
  it('exchanges the refresh token and exposes the user id and rotated token', async () => {
    const { fetch, requests } = fakeFetch(tokenRefresh);

    const session = await resumeSession({ anonKey: 'anon-key', refreshToken: 'stored-token', fetch });

    expect(session.userId).toBe(USER_ID);
    expect(session.refreshToken).toBe(ROTATED_REFRESH_TOKEN);
    const [request] = requests;
    expect(request?.url.searchParams.get('grant_type')).toBe('refresh_token');
    expect(JSON.parse(request?.body ?? '{}')).toMatchObject({ refresh_token: 'stored-token' });
    expect(request?.headers.get('apikey')).toBe('anon-key');
  });

  it('fails with a WikiMastersError on a revoked refresh token', async () => {
    const { fetch } = fakeFetch(() => ({
      status: 400,
      body: { error: 'invalid_grant', error_description: 'Invalid Refresh Token: Already Used', error_code: 'refresh_token_already_used' },
    }));

    await expect(resumeSession({ anonKey: 'anon-key', refreshToken: 'stored-token', fetch })).rejects.toThrow(WikiMastersError);
  });
});
