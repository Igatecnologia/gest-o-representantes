import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { Button, PageHeader } from "@/components/ui";
import { FileText, Plus } from "lucide-react";
import { ProposalList } from "./client";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function PropostasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { isAdmin, repId } = await requireScope();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const search = (params.q ?? "").trim();
  const statusFilter = params.status ?? "";

  const scopeWhere = isAdmin ? undefined : eq(schema.proposals.representativeId, repId!);
  const statusWhere = statusFilter ? eq(schema.proposals.status, statusFilter) : undefined;

  const searchWhere = search
    ? or(
        like(schema.customers.name, `%${search}%`),
        like(schema.products.name, `%${search}%`),
        like(schema.representatives.name, `%${search}%`)
      )
    : undefined;

  const conditions = [scopeWhere, statusWhere, searchWhere].filter(Boolean);
  const whereClause = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [[{ total }], proposals] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(schema.proposals)
      .leftJoin(schema.customers, eq(schema.customers.id, schema.proposals.customerId))
      .leftJoin(schema.representatives, eq(schema.representatives.id, schema.proposals.representativeId))
      .leftJoin(schema.products, eq(schema.products.id, schema.proposals.productId))
      .where(whereClause),
    db
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
      .where(whereClause)
      .orderBy(desc(schema.proposals.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
  ]);

  // Totals aggregation — only for proposals on this page
  const totalsMap: Record<string, { oneTime: number; monthly: number }> = {};

  if (proposals.length > 0) {
    try {
      const proposalIds = proposals.map((p) => p.id);
      const itemAgg = await db
        .select({
          proposalId: schema.proposalItems.proposalId,
          type: schema.proposalItems.type,
          sum: sql<number>`coalesce(sum(${schema.proposalItems.value}), 0)`,
        })
        .from(schema.proposalItems)
        .where(sql`${schema.proposalItems.proposalId} IN (${sql.join(proposalIds.map(id => sql`${id}`), sql`, `)})`)
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
  }

  return (
    <>
      <PageHeader
        title="Propostas"
        description={`${total} proposta(s)`}
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
      <ProposalList
        proposals={proposals}
        totalsMap={totalsMap}
        isAdmin={isAdmin}
        total={total}
        page={page}
        search={search}
        statusFilter={statusFilter}
      />
    </>
  );
}
