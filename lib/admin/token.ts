import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Signed admin session token: "<expiry ms>.<hmac>". Used by proxy.ts and the server,
// so it reads process.env directly instead of the server-only env() helper.

export const ADMIN_COOKIE = "co_admin";
export const SESSION_DAYS = 7;

function secrets() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || !password) return null;
  // Mixing in a password fingerprint means changing ADMIN_PASSWORD signs everyone out.
  const fingerprint = createHash("sha256").update(password).digest("hex").slice(0, 16);
  return { secret, fingerprint };
}

function sign(expires: number, s: { secret: string; fingerprint: string }) {
  return createHmac("sha256", s.secret).update(`${expires}.${s.fingerprint}`).digest("base64url");
}

export function createToken(now = Date.now()) {
  const s = secrets();
  if (!s) throw new Error("ADMIN_PASSWORD and ADMIN_SESSION_SECRET must be set");
  const expires = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return { token: `${expires}.${sign(expires, s)}`, expires: new Date(expires) };
}

export function verifyToken(token: string | undefined, now = Date.now()) {
  const s = secrets();
  if (!s || !token) return false;
  const [expRaw, mac] = token.split(".");
  const expires = Number(expRaw);
  if (!mac || !Number.isFinite(expires) || expires < now) return false;
  const expected = Buffer.from(sign(expires, s));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function passwordMatches(attempt: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  // Compare fixed-length digests so the comparison takes the same time for any input.
  const a = createHash("sha256").update(attempt).digest();
  const b = createHash("sha256").update(password).digest();
  return timingSafeEqual(a, b);
}
