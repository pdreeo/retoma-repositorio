import { NextResponse } from 'next/server';
import { authenticated, fail, databaseError } from '@/lib/api';
import { resolveSchema } from '@/lib/validation';
export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (auth.error) return auth.error;
  const parsed = resolveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const v = parsed.data;
  const { error } = await auth.db.rpc('resolve_quote', {
    p_id: v.id,
    p_status: v.status,
    p_reason: v.reason ?? null,
    p_note: v.note ?? null,
  });
  return error ? databaseError() : NextResponse.json({ ok: true });
}
