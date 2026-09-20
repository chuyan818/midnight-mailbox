import crypto from "node:crypto";
import type { Request } from "express";
import { getUserByEmail, getUserByOpenId, upsertUser } from "../db";

const STATE_TTL_MS = 10 * 60 * 1000;

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
  };
}

function stateSecret() {
  return process.env.JWT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "development-only-google-state-secret";
}

export function isGoogleOAuthConfigured() {
  const config = getGoogleConfig();
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}

export function createGoogleState(returnPath = "/") {
  const payload = Buffer.from(JSON.stringify({ returnPath: returnPath.startsWith("/") ? returnPath : "/", issuedAt: Date.now() })).toString("base64url");
  const signature = crypto.createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyGoogleState(state: string) {
  try {
    const [payload, signature] = state.split(".");
    if (!payload || !signature) return undefined;
    const expected = crypto.createHmac("sha256", stateSecret()).update(payload).digest("base64url");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { returnPath?: string; issuedAt?: number };
    if (!parsed.issuedAt || Date.now() - parsed.issuedAt > STATE_TTL_MS) return undefined;
    return { returnPath: parsed.returnPath?.startsWith("/") ? parsed.returnPath : "/" };
  } catch {
    return undefined;
  }
}

export function getGoogleAuthorizationUrl(req: Request, state = createGoogleState(typeof req.query.returnPath === "string" ? req.query.returnPath : "/")) {
  const config = getGoogleConfig();
  if (!isGoogleOAuthConfigured()) throw new Error("Google OAuth is not configured");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  return url.toString();
}

async function exchangeGoogleCode(code: string) {
  const config = getGoogleConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error(`Google token exchange failed: ${response.status}`);
  return await response.json() as { access_token?: string };
}

export async function authenticateGoogleCallback(code: string) {
  const tokens = await exchangeGoogleCode(code);
  if (!tokens.access_token) throw new Error("Google access token missing");
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tokens.access_token}` } });
  if (!response.ok) throw new Error(`Google userinfo failed: ${response.status}`);
  const profile = await response.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!profile.sub || !profile.email || profile.email_verified === false) throw new Error("Google account email is unavailable or unverified");

  const existing = await getUserByEmail(profile.email);
  const openId = existing?.openId ?? `google:${profile.sub}`;
  await upsertUser({
    openId,
    email: profile.email.toLowerCase(),
    name: profile.name ?? existing?.name ?? profile.email.split("@")[0],
    loginMethod: "google",
    emailVerifiedAt: existing?.emailVerifiedAt ?? new Date(),
    lastSignedIn: new Date(),
  });
  return (await getUserByOpenId(openId))!;
}

export const googleOAuthConfig = { stateTtlMs: STATE_TTL_MS };
