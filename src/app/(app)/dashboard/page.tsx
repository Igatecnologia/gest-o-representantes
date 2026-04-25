import Link from "next/link";
import { db, schema } from "@/lib/db";
import { and, eq, gte, sql, desc, SQL } from "drizzle-orm";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "./revenue-chart";
import { brl, dateShort } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  CheckCircle2,
  Receipt,
  Users,
  ArrowRight,
  Trophy,
  MapPin,
  Kanban,
  Target,
} from "lucide-react";
import { requireScope } from "@/lib/auth";
import { DashboardShell, CommissionProgress, QuickActions, TopCustomers } from "./client";

export const dynamic = "force-dynamic";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export default async function DashboardPage() {
  const { isAdmin, repId, session } = await requireScope();

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const firstOfLastMonth = new Date(firstOfMonth);
  firstOfLastMonth.setMonth(firstOfLastMonth.getMonth() - 1);

  // Scope helpers
  const scopeSales = (extra: SQL | undefined) =>
    isAdmin
      ? extra
      : extra
      ? and(extra, eq(schema.sales.representativeId, repId))
      : eq(schema.sales.representativeId, repId);

  const scopeCommissions = (extra: SQL | undefined) =>
    isAdmin
      ? extra
      : extra
      ? and(extra, eq(schema.commissions.representativeId, repId))
      : eq(schema.commissions.representativeId, repId);

  const scopeCustomers = isAdmin
    ? undefined
    : eq(schema.customers.representativeId, repId);

  const [salesMonth] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.sales.total}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(schema.sales)
    .where(
      scopeSales(
        and(eq(schema.sales.status, "approved"), gte(schema.sales.createdAt, firstOfMonth))
      )
    );

  const [salesLastMonth] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.sales.total}), 0)`,
    })
    .from(schema.sales)
    .where(
      scopeSales(
        and(
          eq(schema.sales.status, "approved"),
          gte(schema.sales.createdAt, firstOfLastMonth),
          sql`${schema.sales.createdAt} < ${firstOfMonth.getTime()}`
        )
      )
    );

  const delta =
    salesLastMonth && salesLastMonth.total > 0
      ? ((salesMonth.total - salesLastMonth.total) / salesLastMonth.total) * 100
      : 0;

  const [commissionsPending] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.commissions.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(schema.commissions)
    .where(scopeCommissions(eq(schema.commissions.status, "pending")));

  const [commissionsPaid] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.commissions.amount}), 0)`,
    })
    .from(schema.commissions)
    .where(scopeCommissions(eq(schema.commissions.status, "paid")));

  // Commission paid THIS month (for rep progress bar)
  const [commissionsPaidThisMonth] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.commissions.amount}), 0)`,
    })
    .from(schema.commissions)
    .where(
      scopeCommissions(
        and(
          eq(schema.commissions.status, "paid"),
          gte(schema.commissions.paidAt, firstOfMonth)
        )
      )
    );

  const [customerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.customers)
    .where(scopeCustomers);

  const dailyRaw = await db
    .select({
      day: sql<string>`strftime('%Y-%m-%d', datetime(${schema.sales.createdAt} / 1000, 'unixepoch'))`,
      total: sql<number>`coalesce(sum(${schema.sales.total}), 0)`,
    })
    .from(schema.sales)
    .where(
      scopeSales(
        and(eq(schema.sales.status, "approved"), gte(schema.sales.createdAt, daysAgo(29)))
      )
    )
    .groupBy(sql`strftime('%Y-%m-%d', datetime(${schema.sales.createdAt} / 1000, 'unixepoch'))`);

  const dailyMap = new Map(dailyRaw.map((r) => [r.day, r.total]));
  const daily: { day: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    daily.push({ day: key, total: dailyMap.get(key) ?? 0 });
  }

  const sparkSales = daily.map((d) => d.total);

  // Ranking (admin) or top customers (rep)
  const rankingQuery = db
    .select({
      repId: schema.representatives.id,
      repName: schema.representatives.name,
      totalSales: sql<number>`coalesce(sum(${schema.sales.total}), 0)`,
      salesCount: sql<number>`count(${schema.sales.id})`,
    })
    .from(schema.representatives)
    .leftJoin(
      schema.sales,
      and(
        eq(schema.sales.representativeId, schema.representatives.id),
        eq(schema.sales.status, "approved"),
        gte(schema.sales.createdAt, firstOfMonth)
      )
    )
    .groupBy(schema.representatives.id)
    .orderBy(desc(sql`coalesce(sum(${schema.sales.total}), 0)`))
    .limit(5);

  const ranking = await rankingQuery;
  const rankingTop = ranking[0]?.totalSales ?? 0;

  // Top 3 customers for rep
  let topCustomers: { id: string; name: string; total: number }[] = [];
  if (!isAdmin && repId) {
    topCustomers = await db
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        total: sql<number>`coalesce(sum(${schema.sales.total}), 0)`,
      })
      .from(schema.sales)
      .innerJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
      .where(
        and(
          eq(schema.sales.representativeId, repId),
          eq(schema.sales.status, "approved"),
          gte(schema.sales.createdAt, firstOfMonth)
        )
      )
      .groupBy(schema.customers.id)
      .orderBy(desc(sql`coalesce(sum(${schema.sales.total}), 0)`))
      .limit(3);
  }

  const recentSales = await db
    .select({
      id: schema.sales.id,
      total: schema.sales.total,
      createdAt: schema.sales.createdAt,
      status: schema.sales.status,
      repName: schema.representatives.name,
      customerName: schema.customers.name,
      productName: schema.products.name,
    })
    .from(schema.sales)
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.sales.representativeId)
    )
    .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
    .leftJoin(schema.products, eq(schema.products.id, schema.sales.productId))
    .where(scopeSales(undefined))
    .orderBy(desc(schema.sales.createdAt))
    .limit(6);

  return (
    <DashboardShell>
      <PageHeader
        title={isAdmin ? "Dashboard" : `Olá, ${session.name.split(" ")[0]}`}
        description={
          isAdmin ? "Visão geral da operação comercial" : "Sua operação neste mês"
        }
        actions={
          <Link href="/vendas/nova">
            <Button>
              Nova venda
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isAdmin ? "Vendas no mês" : "Suas vendas no mês"}
          value={brl(salesMonth?.total ?? 0)}
          delta={delta}
          hint={`${salesMonth?.count ?? 0} venda(s) aprovada(s)`}
          sparkline={sparkSales}
          tone="primary"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Comissão pendente"
          value={brl(commissionsPending?.total ?? 0)}
          hint={`${commissionsPending?.count ?? 0} aberta(s)`}
          icon={<Wallet className="h-3.5 w-3.5" />}
        />
        <StatCard
          label={isAdmin ? "Comissão paga (total)" : "Comissão paga"}
          value={brl(commissionsPaid?.total ?? 0)}
          hint="acumulado histórico"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        />
        <StatCard
          label={isAdmin ? "Clientes ativos" : "Meus clientes"}
          value={String(customerCount?.count ?? 0)}
          hint={isAdmin ? "base total" : "vinculados a você"}
          icon={<Users className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Quick Actions — só para rep */}
      {!isAdmin && (
        <QuickActions />
      )}

      {/* Commission Progress — só para rep */}
      {!isAdmin && (
        <CommissionProgress
          paidThisMonth={commissionsPaidThisMonth?.total ?? 0}
          pending={commissionsPending?.total ?? 0}
        />
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Receita — últimos 30 dias</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Vendas aprovadas por dia
              </p>
            </div>
            <Badge tone="brand">30d</Badge>
          </div>
          <div className="h-64">
            <RevenueChart data={daily} />
          </div>
        </Card>

        {isAdmin ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Trophy className="h-4 w-4 text-amber-400" />
                Ranking do mês
              </h2>
            </div>
            {ranking.length === 0 ? (
              <EmptyState title="Sem representantes" icon={Users} />
            ) : (
              <ul className="space-y-2.5">
                {ranking.map((r, i) => {
                  const pct =
                    rankingTop > 0
                      ? Math.max(4, ((r.totalSales ?? 0) / rankingTop) * 100)
                      : 0;
                  return (
                    <li key={r.repId} className="group">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${
                              i === 0
                                ? "bg-amber-500/15 text-amber-400"
                                : i === 1
                                ? "bg-zinc-500/15 text-zinc-300"
                                : i === 2
                                ? "bg-orange-600/15 text-orange-400"
                                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <Avatar name={r.repName} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{r.repName}</div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">
                              {r.salesCount} venda(s)
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold tabular-nums">
                          {brl(r.totalSales ?? 0)}
                        </div>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                        <div
                          className="h-full rounded-full bg-gradient-brand transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-[var(--color-primary)]" />
                Meu progresso
              </h2>
              <RepOwnSummary repId={repId!} />
            </Card>

            {topCustomers.length > 0 && (
              <TopCustomers customers={topCustomers} />
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-[var(--color-primary)]" />
                {isAdmin ? "Vendas recentes" : "Suas vendas recentes"}
              </h2>
            </div>
            <Link
              href="/vendas"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Ver todas →
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <EmptyState title="Nenhuma venda registrada" icon={Receipt} />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Data</TH>
                  {isAdmin && <TH>Representante</TH>}
                  <TH>Cliente</TH>
                  <TH>Produto</TH>
                  <TH className="text-right">Total</TH>
                </tr>
              </THead>
              <tbody>
                {recentSales.map((s) => (
                  <TR key={s.id}>
                    <TD className="text-[var(--color-text-muted)]">
                      {dateShort(s.createdAt)}
                    </TD>
                    {isAdmin && (
                      <TD>
                        <div className="flex items-center gap-2">
                          {s.repName && <Avatar name={s.repName} size="sm" />}
                          <span>{s.repName ?? "-"}</span>
                        </div>
                      </TD>
                    )}
                    <TD>{s.customerName ?? "-"}</TD>
                    <TD className="text-[var(--color-text-muted)]">
                      {s.productName ?? "-"}
                    </TD>
                    <TD className="text-right font-semibold tabular-nums">
                      {brl(s.total)}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

async function RepOwnSummary({ repId }: { repId: string }) {
  const [deals] = await db
    .select({
      open: sql<number>`count(case when ${schema.deals.stage} not in ('won','lost') then 1 end)`,
      won: sql<number>`count(case when ${schema.deals.stage} = 'won' then 1 end)`,
      lost: sql<number>`count(case when ${schema.deals.stage} = 'lost' then 1 end)`,
      openValue: sql<number>`coalesce(sum(case when ${schema.deals.stage} not in ('won','lost') then ${schema.deals.value} else 0 end), 0)`,
    })
    .from(schema.deals)
    .where(eq(schema.deals.representativeId, repId));

  const wonCount = deals?.won ?? 0;
  const lostCount = deals?.lost ?? 0;
  const closedTotal = wonCount + lostCount;
  const winRate = closedTotal > 0 ? Math.round((wonCount / closedTotal) * 100) : null;

  const items = [
    { label: "Negócios abertos", value: String(deals?.open ?? 0) },
    { label: "Ganhos no total", value: String(wonCount) },
    { label: "Pipeline em aberto", value: brl(deals?.openValue ?? 0) },
    { label: "Taxa de conversão", value: winRate !== null ? `${winRate}%` : "—" },
  ];

  return (
    <dl className="space-y-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2.5"
        >
          <dt className="text-xs text-[var(--color-text-muted)]">{it.label}</dt>
          <dd className="text-sm font-semibold tabular-nums">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
