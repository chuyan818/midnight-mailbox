import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Railway PostgreSQL requires TLS. drizzle-kit receives only the URL, unlike
// server/db.ts which passes the Pool SSL option explicitly, so normalize the
// URL here as well. Local PostgreSQL can opt out with DATABASE_SSL=false.
const migrationUrl = (() => {
  if (process.env.DATABASE_SSL === "false") return connectionString;

  const url = new URL(connectionString);
  if (!url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }
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
