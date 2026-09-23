import { NextResponse } from 'next/server';
import { authenticated, databaseError, fail } from '@/lib/api';
import { rescheduleSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (auth.error) return auth.error;
  const parsed = rescheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { error } = await auth.db.rpc('reschedule_followup', {
    p_quote_id: parsed.data.id,
    p_due_on: parsed.data.due_on,
  });
  return error ? databaseError() : NextResponse.json({ ok: true });
}
