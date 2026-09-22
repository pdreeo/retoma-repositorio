import { NextResponse } from 'next/server';
import { authenticated, fail, databaseError } from '@/lib/api';
import { companySchema } from '@/lib/validation';
export async function POST(request: Request) {
  return save(request, 'create_company');
}
export async function PATCH(request: Request) {
  return save(request, 'update_company');
}
async function save(request: Request, rpc: string) {
  const auth = await authenticated(request);
  if (auth.error) return auth.error;
  const parsed = companySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { error } = await auth.db.rpc(rpc, { p_name: parsed.data.name });
  return error ? databaseError() : NextResponse.json({ ok: true });
}
