import { db } from "./db";
import { sql } from "drizzle-orm";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS _rate_limit (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      reset_at INTEGER NOT NULL
    )
  `);
  tableReady = true;
}

export async function checkRateLimit(key: string): Promise<{
  blocked: boolean;
  retryAfterSeconds: number;
}> {
  await ensureTable();
  const now = Date.now();

  await db.run(sql`DELETE FROM _rate_limit WHERE reset_at < ${now}`);

  const result = await db.run(
    sql`SELECT count, reset_at FROM _rate_limit WHERE key = ${key}`
  );

  const row = result.rows[0] as unknown as { count: number; reset_at: number } | undefined;

  if (!row) {
    await db.run(
      sql`INSERT INTO _rate_limit (key, count, reset_at) VALUES (${key}, 1, ${now + WINDOW_MS})`
    );
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const newCount = Number(row.count) + 1;
  await db.run(
    sql`UPDATE _rate_limit SET count = ${newCount} WHERE key = ${key}`
  );

  if (newCount > MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((Number(row.reset_at) - now) / 1000);
    return { blocked: true, retryAfterSeconds: Math.max(0, retryAfterSeconds) };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}
