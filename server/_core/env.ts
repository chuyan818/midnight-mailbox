const cookieSecret = process.env.JWT_SECRET ?? "";
const isProduction = process.env.NODE_ENV === "production";
const redisUrl = process.env.REDIS_URL ?? "";

if (isProduction && cookieSecret.length < 32) {
  throw new Error(
    "JWT_SECRET must be configured with at least 32 characters in production"
  );
}

if (isProduction && !redisUrl) {
  throw new Error("REDIS_URL must be configured in production");
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret,
  redisUrl,
  databaseUrl:
    (process.env.MIDNIGHT_DATABASE_URL || process.env.DATABASE_URL) ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
