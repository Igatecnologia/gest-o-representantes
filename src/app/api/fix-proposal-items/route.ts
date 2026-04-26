import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, like } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Corrige items com label contendo "Licen" (Licenca/Licença) que estao como one_time
  const updated = await db
    .update(schema.proposalItems)
    .set({ type: "monthly" })
    .where(
      and(
        eq(schema.proposalItems.type, "one_time"),
        like(schema.proposalItems.label, "%icen%")
      )
    )
    .returning({ id: schema.proposalItems.id });

  return NextResponse.json({
    ok: true,
    fixedCount: updated.length,
    message: `${updated.length} item(ns) corrigido(s) de one_time para monthly`,
  });
}
