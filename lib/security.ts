import { createHmac, timingSafeEqual } from 'node:crypto';
const cookieName = 'dg_access';
function secret() { return process.env.APP_ACCESS_TOKEN || ''; }
function digest(value: string) { return createHmac('sha256', secret()).update(value).digest('hex'); }
export function checkPass(value: string) {
  if (secret().length < 24) return false;
  const a = Buffer.from(digest(value));
  const b = Buffer.from(digest(secret()));
  return timingSafeEqual(a, b);
}
export function cookieValue() { return digest('dg-checker-session-v1'); }
export function authorized(rawCookie: string | null) {
  if (secret().length < 24) return false;
  const found = rawCookie?.split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!found) return false;
  const a = Buffer.from(found), b = Buffer.from(cookieValue());
  return a.length === b.length && timingSafeEqual(a,b);
}
export { cookieName };
