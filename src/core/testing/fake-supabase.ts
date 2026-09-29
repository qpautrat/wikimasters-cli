export interface RecordedRequest {
  method: string;
  url: URL;
  headers: Headers;
  body: string | null;
}

export interface FakeResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export type Route = (request: RecordedRequest) => FakeResponse | undefined;

export const USER_ID = '5d14f22b-ea20-4a25-bc4a-fa879af3d0ee';
export const ACCESS_TOKEN = 'fake-access-token';

export const passwordSignIn: Route = ({ method, url }) => {
  if (method !== 'POST' || url.pathname !== '/auth/v1/token') return undefined;
  return {
    status: 200,
    body: {
      access_token: ACCESS_TOKEN,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'fake-refresh-token',
      user: { id: USER_ID, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} },
    },
  };
};

export function fakeFetch(...routes: Route[]) {
  const requests: RecordedRequest[] = [];

  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const recorded: RecordedRequest = {
      method: request.method,
      url: new URL(request.url),
      headers: request.headers,
      body: request.body ? await request.text() : null,
    };
    requests.push(recorded);

    const response = routes.map((route) => route(recorded)).find((match) => match !== undefined);
    if (!response) {
      return new Response(JSON.stringify({ message: 'no fake route' }), { status: 599 });
    }
    const body = response.body === undefined ? null : JSON.stringify(response.body);
    return new Response(body, {
      status: response.status,
      headers: { 'content-type': 'application/json', ...response.headers },
    });
  };

  return { fetch, requests };
}
