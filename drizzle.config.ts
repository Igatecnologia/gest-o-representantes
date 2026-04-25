import type { Config } from "drizzle-kit";

const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:");

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: isLocal ? "sqlite" : "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
