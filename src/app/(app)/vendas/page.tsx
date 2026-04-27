import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql } from "drizzle-orm";
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { PageStats, type PageStat } from "@/components/page-stats";
import { brl } from "@/lib/utils";
import { requireScope } from "@/lib/auth";
import { SalesList } from "./client";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function SalesPage({
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

  const scopeWhere = isAdmin ? undefined : eq(schema.sales.representativeId, repId);
  const statusWhere = statusFilter ? eq(schema.sales.status, statusFilter) : undefined;

  const fromDate = from ? new Date(from + "T00:00:00") : null;
  const toDate = to ? new Date(to + "T23:59:59.999") : null;
  const dateWhere = fromDate || toDate
    ? sql.join(
        [
          ...(fromDate ? [sql`${schema.sales.createdAt} >= ${fromDate.getTime()}`] : []),
          ...(toDate ? [sql`${schema.sales.createdAt} <= ${toDate.getTime()}`] : []),
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

  const countQuery = db
    .select({ total: sql<number>`count(*)` })
    .from(schema.sales)
    .leftJoin(schema.representatives, eq(schema.representatives.id, schema.sales.representativeId))
    .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
    .leftJoin(schema.products, eq(schema.products.id, schema.sales.productId))
    .where(whereClause);

  const dataQuery = db
    .select({
      id: schema.sales.id,
      createdAt: schema.sales.createdAt,
      total: schema.sales.total,
      quantity: schema.sales.quantity,
      status: schema.sales.status,
      repName: schema.representatives.name,
      customerId: schema.sales.customerId,
      customerName: schema.customers.name,
      productName: schema.products.name,
    })
    .from(schema.sales)
    .leftJoin(schema.representatives, eq(schema.representatives.id, schema.sales.representativeId))
    .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
    .leftJoin(schema.products, eq(schema.products.id, schema.sales.productId))
    .where(whereClause)
    .orderBy(desc(schema.sales.createdAt))
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

  // Stats por status — escopo do user
  const statsScope = isAdmin ? undefined : eq(schema.sales.representativeId, repId);
  const [[{ total }], sales, [statsAgg]] = await Promise.all([
    countQuery,
    dataQuery,
    db
      .select({
        approvedCount: sql<number>`count(case when ${schema.sales.status} = 'approved' then 1 end)`,
        approvedTotal: sql<number>`coalesce(sum(case when ${schema.sales.status} = 'approved' then ${schema.sales.total} else 0 end), 0)`,
        pendingCount: sql<number>`count(case when ${schema.sales.status} = 'pending' then 1 end)`,
        cancelledCount: sql<number>`count(case when ${schema.sales.status} = 'cancelled' then 1 end)`,
      })
      .from(schema.sales)
      .where(statsScope),
  ]);

  const approvedCount = statsAgg?.approvedCount ?? 0;
  const stats: PageStat[] = [
    {
      label: "Aprovadas",
      value: approvedCount,
      hint: brl(statsAgg?.approvedTotal ?? 0),
      tone: "emerald",
      icon: CheckCircle2,
    },
    {
      label: "Pendentes",
      value: statsAgg?.pendingCount ?? 0,
      hint: "aguardando",
      tone: "amber",
      icon: Clock,
    },
    {
      label: "Canceladas",
      value: statsAgg?.cancelledCount ?? 0,
      hint: "histórico",
      tone: "rose",
      icon: XCircle,
    },
    {
      label: "Ticket médio",
      value: approvedCount > 0
        ? brl(Math.round((statsAgg?.approvedTotal ?? 0) / approvedCount))
        : brl(0),
      hint: "por venda aprovada",
      tone: "primary",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <PageHeader
        title={isAdmin ? "Vendas" : "Minhas vendas"}
        description={`${total} venda(s) registrada(s)`}
        icon={Receipt}
        actions={
          <Link href="/vendas/nova">
            <Button>
              <Plus className="h-4 w-4" />
              Nova venda
            </Button>
          </Link>
        }
      />
      <PageStats stats={stats} />
      <SalesList
        sales={sales}
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
