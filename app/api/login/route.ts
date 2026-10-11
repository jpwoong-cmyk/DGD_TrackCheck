import { NextRequest, NextResponse } from 'next/server';
import { checkPass, cookieName, cookieValue } from '../../../lib/security';
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.password !== 'string' || !checkPass(body.password)) return NextResponse.json({ error: 'Invalid access code or missing server configuration.' }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, cookieValue(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 8 });
  return response;
}
