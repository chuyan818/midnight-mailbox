import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Railway PostgreSQL requires TLS, but its managed certificate chain is not
// publicly verifiable from the migration container. Match server/db.ts, which
// uses rejectUnauthorized: false, while still requiring an encrypted channel.
// Local PostgreSQL can opt out with DATABASE_SSL=false.
const migrationUrl = (() => {
  if (process.env.DATABASE_SSL === "false") return connectionString;

  const url = new URL(connectionString);
  url.searchParams.set("sslmode", "no-verify");
  return url.toString();
})();

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle-pg",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
