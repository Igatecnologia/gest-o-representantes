import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql } from "drizzle-orm";
import { Building2, Plus } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
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

  const [[{ total }], customers] = await Promise.all([
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
  ]);

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
