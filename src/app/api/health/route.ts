import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ status: "ok" });
  }

  try {
    await db.run(sql`SELECT 1`);
    return Response.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch {
    return Response.json(
      { status: "error", message: "Database unreachable" },
      { status: 503 }
    );
  }
}
