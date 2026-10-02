import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type UserRole = "customer" | "manager" | "admin";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  status: string;
};

type TokenPayload = AuthUser & { iat: number; exp: number };

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [, salt, digest] = storedHash.split("$");
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function signToken(user: AuthUser, secret: string) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = { ...user, iat: now, exp: now + 60 * 60 * 8 };
  const body = `${header}.${encode(payload)}`;
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyToken(token: string, secret: string): AuthUser | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = decode<TokenPayload>(body);
    if (payload.exp < Math.floor(Date.now() / 1000) || payload.status !== "active") return null;
    return { id: payload.id, email: payload.email, full_name: payload.full_name, role: payload.role, status: payload.status };
  } catch {
    return null;
  }
}
