import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/env";

export type TokenPurpose = "verify_email" | "reset_password";

export interface SignedTokenPayload {
  v: 1;
  p: TokenPurpose;
  sub: string;
  exp: number; // unix seconds
}

function base64UrlEncode(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function sign(data: string) {
  return createHmac("sha256", env.NEXTAUTH_SECRET).update(data).digest();
}

export function signToken(payload: Omit<SignedTokenPayload, "v">) {
  const full: SignedTokenPayload = { v: 1, ...payload };
  const body = base64UrlEncode(JSON.stringify(full));
  const sig = base64UrlEncode(sign(body));
  return `${body}.${sig}`;
}

export function verifyToken(token: string): SignedTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");

  const [body, sig] = parts;
  const expected = sign(body);
  const actual = base64UrlDecode(sig);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(body).toString("utf8")) as SignedTokenPayload;

  if (payload.v !== 1) throw new Error("Unsupported token version");
  if (!payload.sub || !payload.p || !payload.exp) throw new Error("Invalid token payload");

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Token expired");

  return payload;
}
