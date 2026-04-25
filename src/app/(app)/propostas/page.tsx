import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { Button, PageHeader } from "@/components/ui";
import { FileText, Plus } from "lucide-react";
import { ProposalList } from "./client";

export const dynamic = "force-dynamic";

export default async function PropostasPage() {
  const { isAdmin, repId } = await requireScope();

  const where = isAdmin ? undefined : eq(schema.proposals.representativeId, repId!);

  const proposals = await db
    .select({
      id: schema.proposals.id,
      status: schema.proposals.status,
      validUntil: schema.proposals.validUntil,
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

  // Totals aggregation
  const totalsMap: Record<string, { oneTime: number; monthly: number }> = {};

  try {
    const itemAgg = await db
      .select({
        proposalId: schema.proposalItems.proposalId,
        type: schema.proposalItems.type,
        sum: sql<number>`coalesce(sum(${schema.proposalItems.value}), 0)`,
      })
      .from(schema.proposalItems)
      .groupBy(schema.proposalItems.proposalId, schema.proposalItems.type);

    for (const row of itemAgg) {
      const cur = totalsMap[row.proposalId] ?? { oneTime: 0, monthly: 0 };
      if (row.type === "monthly") {
        cur.monthly = row.sum;
      } else {
        cur.oneTime += row.sum;
      }
      totalsMap[row.proposalId] = cur;
    }
  } catch (err) {
    console.error("[propostas] Erro ao buscar totais:", err);
  }

  return (
    <>
      <PageHeader
        title="Propostas"
        description={`${proposals.length} proposta(s)`}
        icon={FileText}
        actions={
          <Link href="/propostas/nova">
            <Button>
              <Plus className="h-4 w-4" />
              Nova proposta
            </Button>
          </Link>
        }
      />
      <ProposalList proposals={proposals} totalsMap={totalsMap} isAdmin={isAdmin} />
    </>
  );
}
