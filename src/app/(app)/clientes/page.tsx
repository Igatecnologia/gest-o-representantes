import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql, and, gte, isNull } from "drizzle-orm";
import { Building2, Plus, Users, MapPin, UserX } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { PageStats, type PageStat } from "@/components/page-stats";
import { requireScope } from "@/lib/auth";
import { CustomerList } from "./client";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { isAdmin, repId } = await requireScope();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const search = (params.q ?? "").trim();

  const scopeWhere = isAdmin ? undefined : eq(schema.customers.representativeId, repId);

  const searchWhere = search
    ? or(
        like(schema.customers.name, `%${search}%`),
        like(schema.customers.tradeName, `%${search}%`),
        like(schema.customers.document, `%${search}%`),
        like(schema.customers.city, `%${search}%`),
        like(schema.customers.email, `%${search}%`)
      )
    : undefined;

  const whereClause =
    scopeWhere && searchWhere
      ? sql`${scopeWhere} AND ${searchWhere}`
      : scopeWhere ?? searchWhere;

  // Stats — calculadas em paralelo com a lista
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const [[{ total }], customers, [statsAgg]] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(schema.customers)
      .where(whereClause),
    db
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        tradeName: schema.customers.tradeName,
        document: schema.customers.document,
        email: schema.customers.email,
        phone: schema.customers.phone,
        city: schema.customers.city,
        state: schema.customers.state,
        repName: schema.representatives.name,
      })
      .from(schema.customers)
      .leftJoin(
        schema.representatives,
        eq(schema.representatives.id, schema.customers.representativeId)
      )
      .where(whereClause)
      .orderBy(desc(schema.customers.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db
      .select({
        thisMonth: sql<number>`count(case when ${schema.customers.createdAt} >= ${firstOfMonth.getTime()} then 1 end)`,
        unassigned: sql<number>`count(case when ${schema.customers.representativeId} is null then 1 end)`,
      })
      .from(schema.customers)
      .where(scopeWhere),
  ]);

  const stats: PageStat[] = [
    {
      label: "Total",
      value: total,
      hint: isAdmin ? "clientes na base" : "seus clientes",
      tone: "primary",
      icon: Users,
    },
    {
      label: "Novos no mês",
      value: statsAgg?.thisMonth ?? 0,
      hint: "cadastrados em " +
        firstOfMonth.toLocaleDateString("pt-BR", { month: "long" }),
      tone: "emerald",
      icon: Building2,
    },
  ];
  if (isAdmin) {
    stats.push({
      label: "Sem dono",
      value: statsAgg?.unassigned ?? 0,
      hint: "aguardando representante",
      tone: "amber",
      icon: UserX,
    });
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? "Clientes" : "Meus clientes"}
        description={`${total} empresa(s) na base`}
        icon={Building2}
        actions={
          <Link href="/clientes/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </Link>
        }
      />
      <PageStats stats={stats} />
      <CustomerList
        customers={customers}
        isAdmin={isAdmin}
        total={total}
        page={page}
        search={search}
      />
    </>
  );
}
