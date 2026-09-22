import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const sessionHeaders = new Headers();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    return response;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          const previousCookies = response.cookies.getAll();
          response = NextResponse.next({ request });
          previousCookies.forEach((cookie) => response.cookies.set(cookie));
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => sessionHeaders.set(key, value));
        },
      },
    },
  );
  const { data, error } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  if (!error && data?.claims?.sub && (path === '/entrar' || path === '/criar-conta')) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    url.search = '';
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response = redirect;
  }
  sessionHeaders.forEach((value, key) => response.headers.set(key, value));
  if (!response.headers.has('Cache-Control'))
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate, max-age=0',
    );
  if (!response.headers.has('Expires')) response.headers.set('Expires', '0');
  if (!response.headers.has('Pragma')) response.headers.set('Pragma', 'no-cache');
  return response;
}
export const config = {
  matcher: [
    '/app/:path*',
    '/api/:path*',
    '/auth/:path*',
    '/entrar',
    '/criar-conta',
    '/recuperar',
    '/nova-senha',
  ],
};
