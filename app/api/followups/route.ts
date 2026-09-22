import { NextResponse } from 'next/server';
import { authenticated, fail, databaseError } from '@/lib/api';
import { followupSchema } from '@/lib/validation';
export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (auth.error) return auth.error;
  const parsed = followupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { error } = await auth.db.rpc('complete_followup', {
    p_id: parsed.data.id,
    p_message: parsed.data.message,
  });
  return error ? databaseError() : NextResponse.json({ ok: true });
}
