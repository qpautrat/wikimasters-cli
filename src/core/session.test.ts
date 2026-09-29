import { describe, expect, it } from 'vitest';
import { WikiMastersError } from './errors.js';
import { signIn } from './session.js';
import { USER_ID, fakeFetch, passwordSignIn } from './testing/fake-supabase.js';

const credentials = { email: 'player@example.test', password: 'secret' };

describe('signIn', () => {
  it('signs in with email and password and exposes the user id', async () => {
    const { fetch, requests } = fakeFetch(passwordSignIn);

    const session = await signIn({ anonKey: 'anon-key', credentials, fetch });

    expect(session.userId).toBe(USER_ID);
    const [request] = requests;
    expect(request?.url.searchParams.get('grant_type')).toBe('password');
    expect(JSON.parse(request?.body ?? '{}')).toMatchObject(credentials);
    expect(request?.headers.get('apikey')).toBe('anon-key');
  });

  it('fails with a WikiMastersError on rejected credentials', async () => {
    const { fetch } = fakeFetch(() => ({
      status: 400,
      body: { error: 'invalid_grant', error_description: 'Invalid login credentials', error_code: 'invalid_credentials' },
    }));

    await expect(signIn({ anonKey: 'anon-key', credentials, fetch })).rejects.toThrow(WikiMastersError);
  });
});
