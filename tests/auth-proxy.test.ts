import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';

const user = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  aud: 'authenticated',
  email: 'qa@example.test',
};
const jwt = (expires: number) =>
  [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(
      JSON.stringify({
        sub: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        exp: expires,
        iat: 1,
      }),
    ).toString('base64url'),
    'test-signature',
  ].join('.');
const session = (expires: number) => ({
  access_token: jwt(expires),
  refresh_token: 'test-refresh',
  token_type: 'bearer',
  expires_at: expires,
  expires_in: 3600,
  user,
});

test('proxy keeps guest forms and redirects authenticated forms without losing refreshed cookies or cache headers', async (t) => {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-public-key';
  t.after(() => {
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = oldKey;
  });
  let refreshes = 0;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/auth/v1/token')) {
      refreshes++;
      return Response.json(session(Math.floor(Date.now() / 1000) + 3600));
    }
    if (url.endsWith('/auth/v1/user')) return Response.json(user);
    throw new Error(`unexpected auth request: ${url}`);
  });
  for (const path of ['/entrar', '/criar-conta']) {
    const guest = await proxy(new NextRequest(`https://retoma.example${path}`));
    assert.equal(guest.status, 200);
    assert.equal(guest.headers.get('location'), null);
    for (const expired of [false, true]) {
      const expires = expired ? 1 : Math.floor(Date.now() / 1000) + 3600;
      const cookie =
        'base64-' + Buffer.from(JSON.stringify(session(expires))).toString('base64url');
      const response = await proxy(
        new NextRequest(`https://retoma.example${path}?error=link`, {
          headers: { cookie: `sb-test-auth-token=${cookie}` },
        }),
      );
      assert.equal(response.status, 307);
      assert.equal(response.headers.get('location'), 'https://retoma.example/app');
      assert.match(response.headers.get('cache-control')!, /private.*no-store/);
      assert.equal(response.headers.get('pragma'), 'no-cache');
      assert.equal(response.headers.get('expires'), '0');
      if (expired) {
        assert.ok(response.cookies.getAll().some((c) => c.name.startsWith('sb-test-auth-token')));
        assert.match(response.headers.get('cache-control')!, /must-revalidate/);
      }
      assert.equal(response.headers.get('x-middleware-next'), null);
    }
  }
  assert.equal(refreshes, 2);
});
