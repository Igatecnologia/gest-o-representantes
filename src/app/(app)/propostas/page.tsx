import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql, gte, and } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { Button, PageHeader } from "@/components/ui";
import { PageStats, type PageStat } from "@/components/page-stats";
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { ProposalList } from "./client";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function PropostasPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { isAdmin, repId } = await requireScope();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const search = (params.q ?? "").trim();
  const statusFilter = params.status ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";

  const scopeWhere = isAdmin ? undefined : eq(schema.proposals.representativeId, repId!);
  const statusWhere = statusFilter ? eq(schema.proposals.status, statusFilter) : undefined;

  const fromDate = from ? new Date(from + "T00:00:00") : null;
  const toDate = to ? new Date(to + "T23:59:59.999") : null;
  const dateWhere = fromDate || toDate
    ? sql.join(
        [
          ...(fromDate ? [sql`${schema.proposals.createdAt} >= ${fromDate.getTime()}`] : []),
          ...(toDate ? [sql`${schema.proposals.createdAt} <= ${toDate.getTime()}`] : []),
        ],
        sql` AND `,
      )
    : undefined;

  const searchWhere = search
    ? or(
        like(schema.customers.name, `%${search}%`),
        like(schema.products.name, `%${search}%`),
        like(schema.representatives.name, `%${search}%`)
      )
    : undefined;

  const conditions = [scopeWhere, statusWhere, dateWhere, searchWhere].filter(Boolean);
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
        customerId: schema.proposals.customerId,
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

  // Stats: contagem por status (ignora filtros — visão geral)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const today = new Date();

  const [statsAgg] = await db
    .select({
      draft: sql<number>`count(case when ${schema.proposals.status} = 'draft' then 1 end)`,
      sent: sql<number>`count(case when ${schema.proposals.status} = 'sent' then 1 end)`,
      accepted: sql<number>`count(case when ${schema.proposals.status} = 'accepted' then 1 end)`,
      expiringSoon: sql<number>`count(case when ${schema.proposals.status} = 'sent'
        and ${schema.proposals.validUntil} >= ${today.getTime()}
        and ${schema.proposals.validUntil} <= ${sevenDaysFromNow.getTime()} then 1 end)`,
    })
    .from(schema.proposals)
    .where(scopeWhere);

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

  const stats: PageStat[] = [
    {
      label: "Rascunhos",
      value: statsAgg?.draft ?? 0,
      hint: "ainda não enviadas",
      tone: "violet",
      icon: Edit,
    },
    {
      label: "Enviadas",
      value: statsAgg?.sent ?? 0,
      hint: "aguardando resposta",
      tone: "primary",
      icon: Send,
    },
    {
      label: "Aceitas",
      value: statsAgg?.accepted ?? 0,
      hint: "fechadas",
      tone: "emerald",
      icon: CheckCircle2,
    },
    {
      label: "Expirando",
      value: statsAgg?.expiringSoon ?? 0,
      hint: "nos próximos 7 dias",
      tone: "amber",
      icon: AlertTriangle,
    },
  ];

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
      <PageStats stats={stats} />
      <ProposalList
        proposals={proposals}
        totalsMap={totalsMap}
        isAdmin={isAdmin}
        total={total}
        page={page}
        search={search}
        statusFilter={statusFilter}
        from={from}
        to={to}
      />
    </>
  );
}
