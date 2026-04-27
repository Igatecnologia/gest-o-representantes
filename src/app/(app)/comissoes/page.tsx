import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql } from "drizzle-orm";
import {
  Wallet,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { PageStats, type PageStat } from "@/components/page-stats";
import { brl } from "@/lib/utils";
import { requireScope } from "@/lib/auth";
import { CommissionList } from "./client";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function CommissionsPage({
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

  const scopeWhere = isAdmin ? undefined : eq(schema.commissions.representativeId, repId);
  const statusWhere = statusFilter ? eq(schema.commissions.status, statusFilter) : undefined;

  // Range de data — filtra pela createdAt da comissão
  const fromDate = from ? new Date(from + "T00:00:00") : null;
  const toDate = to ? new Date(to + "T23:59:59.999") : null;
  const dateWhere = fromDate || toDate
    ? sql.join(
        [
          ...(fromDate ? [sql`${schema.commissions.createdAt} >= ${fromDate.getTime()}`] : []),
          ...(toDate ? [sql`${schema.commissions.createdAt} <= ${toDate.getTime()}`] : []),
        ],
        sql` AND `,
      )
    : undefined;

  const searchWhere = search
    ? or(
        like(schema.representatives.name, `%${search}%`),
        like(schema.customers.name, `%${search}%`)
      )
    : undefined;

  const conditions = [scopeWhere, statusWhere, dateWhere, searchWhere].filter(Boolean);
  const whereClause = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [[{ total }], rows, summaryByRep] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(schema.commissions)
      .leftJoin(schema.sales, eq(schema.sales.id, schema.commissions.saleId))
      .leftJoin(schema.representatives, eq(schema.representatives.id, schema.commissions.representativeId))
      .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
      .where(whereClause),
    db
      .select({
        id: schema.commissions.id,
        amount: schema.commissions.amount,
        status: schema.commissions.status,
        paidAt: schema.commissions.paidAt,
        createdAt: schema.commissions.createdAt,
        saleTotal: schema.sales.total,
        repName: schema.representatives.name,
        customerName: schema.customers.name,
      })
      .from(schema.commissions)
      .leftJoin(schema.sales, eq(schema.sales.id, schema.commissions.saleId))
      .leftJoin(schema.representatives, eq(schema.representatives.id, schema.commissions.representativeId))
      .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
      .where(whereClause)
      .orderBy(desc(schema.commissions.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    (isAdmin
      ? db
          .select({
            repId: schema.representatives.id,
            repName: schema.representatives.name,
            pending: sql<number>`coalesce(sum(case when ${schema.commissions.status} = 'pending' then ${schema.commissions.amount} else 0 end), 0)`,
            paid: sql<number>`coalesce(sum(case when ${schema.commissions.status} = 'paid' then ${schema.commissions.amount} else 0 end), 0)`,
          })
          .from(schema.representatives)
          .leftJoin(schema.commissions, eq(schema.commissions.representativeId, schema.representatives.id))
          .groupBy(schema.representatives.id)
      : db
          .select({
            repId: schema.representatives.id,
            repName: schema.representatives.name,
            pending: sql<number>`coalesce(sum(case when ${schema.commissions.status} = 'pending' then ${schema.commissions.amount} else 0 end), 0)`,
            paid: sql<number>`coalesce(sum(case when ${schema.commissions.status} = 'paid' then ${schema.commissions.amount} else 0 end), 0)`,
          })
          .from(schema.representatives)
          .leftJoin(schema.commissions, eq(schema.commissions.representativeId, schema.representatives.id))
          .groupBy(schema.representatives.id)
          .having(eq(schema.representatives.id, repId))
    ),
  ]);

  // Totais consolidados (todos os reps quando admin, próprio quando rep)
  const totalPending = summaryByRep.reduce((acc, r) => acc + (r.pending ?? 0), 0);
  const totalPaid = summaryByRep.reduce((acc, r) => acc + (r.paid ?? 0), 0);

  const stats: PageStat[] = [
    {
      label: "A receber",
      value: brl(totalPending),
      hint: "comissões pendentes",
      tone: "amber",
      icon: Clock,
    },
    {
      label: "Já pago",
      value: brl(totalPaid),
      hint: "acumulado histórico",
      tone: "emerald",
      icon: CheckCircle2,
    },
    {
      label: "Total geral",
      value: brl(totalPending + totalPaid),
      hint: "soma comissões",
      tone: "primary",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <PageHeader
        title={isAdmin ? "Comissões" : "Minhas comissões"}
        description={isAdmin ? "Controle de comissão por venda" : "Acompanhe o que você tem a receber"}
        icon={Wallet}
      />

      <PageStats stats={stats} />

      {isAdmin && summaryByRep.length > 1 && (
        <Card className="mb-6">
          <h2 className="mb-4 text-sm font-semibold">Resumo por representante</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {summaryByRep.map((r) => (
              <div
                key={r.repId}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 py-3 transition-shadow hover:shadow-sm"
              >
                <div className="text-sm font-semibold">{r.repName}</div>
                <div className="mt-2 flex justify-between text-xs">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                      Pendente
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-amber-500 tabular-nums">
                      {brl(r.pending ?? 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                      Pago
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-emerald-500 tabular-nums">
                      {brl(r.paid ?? 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <CommissionList
        rows={rows}
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
