import { NextResponse } from 'next/server';
import { authenticated, fail, databaseError } from '@/lib/api';
import { quoteSchema } from '@/lib/validation';
export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (auth.error) return auth.error;
  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const v = parsed.data;
  const { data, error } = await auth.db.rpc('save_quote', {
    p_id: v.id ?? null,
    p_customer_name: v.customer_name,
    p_phone: v.phone,
    p_service: v.service,
    p_amount_cents: v.amount,
    p_sent_on: v.sent_on,
    p_notes: v.notes,
  });
  if (error) return databaseError();
  return NextResponse.json({ id: data });
}
