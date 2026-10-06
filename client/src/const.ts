export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const DEFAULT_OAUTH_PORTAL_URL = "https://www.shenye.xin";

export const resolveOAuthPortalUrl = (configuredUrl?: string) => {
  try {
    const parsed = new URL(configuredUrl?.trim() || DEFAULT_OAUTH_PORTAL_URL);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Unsupported OAuth protocol");
    return parsed.origin;
  } catch {
    return DEFAULT_OAUTH_PORTAL_URL;
  }
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = resolveOAuthPortalUrl(import.meta.env.VITE_OAUTH_PORTAL_URL);
  const appId = import.meta.env.VITE_APP_ID || "";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL("/app-auth", oauthPortalUrl);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
