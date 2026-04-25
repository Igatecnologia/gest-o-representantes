import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { requireScope } from "@/lib/auth";

export async function GET() {
  try {
    const { isAdmin, repId } = await requireScope();

    // Step 1: basic proposals query
    const where = isAdmin ? undefined : eq(schema.proposals.representativeId, repId!);

    const proposals = await db
      .select({
        id: schema.proposals.id,
        status: schema.proposals.status,
        createdAt: schema.proposals.createdAt,
        customerName: schema.customers.name,
        repName: schema.representatives.name,
        productName: schema.products.name,
      })
      .from(schema.proposals)
      .leftJoin(schema.customers, eq(schema.customers.id, schema.proposals.customerId))
      .leftJoin(schema.representatives, eq(schema.representatives.id, schema.proposals.representativeId))
      .leftJoin(schema.products, eq(schema.products.id, schema.proposals.productId))
      .where(where)
      .orderBy(desc(schema.proposals.createdAt));

    // Step 2: proposal items aggregation
    let itemAgg: unknown[] = [];
    try {
      itemAgg = await db
        .select({
          proposalId: schema.proposalItems.proposalId,
          type: schema.proposalItems.type,
          sum: sql<number>`coalesce(sum(${schema.proposalItems.value}), 0)`,
        })
        .from(schema.proposalItems)
        .groupBy(schema.proposalItems.proposalId, schema.proposalItems.type);
    } catch (itemErr) {
      return NextResponse.json({
        step: "proposalItems",
        error: String(itemErr),
        message: itemErr instanceof Error ? itemErr.message : "unknown",
        stack: itemErr instanceof Error ? itemErr.stack : undefined,
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      proposalCount: proposals.length,
      itemAggCount: itemAgg.length,
      proposals: proposals.slice(0, 3),
      items: itemAgg,
    });
  } catch (err) {
    return NextResponse.json({
      step: "main",
      error: String(err),
      message: err instanceof Error ? err.message : "unknown",
      stack: err instanceof Error ? err.stack : undefined,
    }, { status: 500 });
  }
}
