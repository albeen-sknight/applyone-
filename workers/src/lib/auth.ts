import type { ApplyOneEnv } from "../env";

const SESSION_COOKIE = "applyone_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  sub: "owner";
  exp: number;
};

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

function getCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function timingSafeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }

  return diff === 0;
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSessionCookie(env: ApplyOneEnv, request: Request) {
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  const payload: SessionPayload = {
    sub: "owner",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmac(encodedPayload, env.SESSION_SECRET);
  const secure = new URL(request.url).protocol === "https:" ? "Secure; SameSite=None" : "SameSite=Lax";

  return `${SESSION_COOKIE}=${encodedPayload}.${signature}; HttpOnly; ${secure}; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "Secure; SameSite=None" : "SameSite=Lax";
  return `${SESSION_COOKIE}=; HttpOnly; ${secure}; Path=/; Max-Age=0`;
}

export async function hasValidSession(request: Request, env: ApplyOneEnv) {
  if (!env.SESSION_SECRET) {
    return false;
  }

  const cookie = getCookie(request, SESSION_COOKIE);
  const [encodedPayload, signature] = cookie?.split(".") || [];

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await hmac(encodedPayload, env.SESSION_SECRET);
  if (!timingSafeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SessionPayload>;
    return payload.sub === "owner" && typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function passwordMatches(password: string, env: ApplyOneEnv) {
  if (!env.OWNER_PASSWORD_HASH) {
    throw new Error("OWNER_PASSWORD_HASH is not configured.");
  }

  const submittedHash = await sha256Hex(password);
  return timingSafeEqual(submittedHash, env.OWNER_PASSWORD_HASH.toLowerCase());
}
