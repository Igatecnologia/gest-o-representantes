import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql } from "drizzle-orm";
import { Receipt, Plus, Download } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { requireScope } from "@/lib/auth";
import { SalesList } from "./client";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { isAdmin, repId } = await requireScope();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const search = (params.q ?? "").trim();
  const statusFilter = params.status ?? "";

  const scopeWhere = isAdmin ? undefined : eq(schema.sales.representativeId, repId);
  const statusWhere = statusFilter ? eq(schema.sales.status, statusFilter) : undefined;

  // Search requires joining — we build conditions on joined columns
  // For count, we need the same joins
  const baseFrom = db
    .select({ id: schema.sales.id })
    .from(schema.sales)
    .leftJoin(schema.representatives, eq(schema.representatives.id, schema.sales.representativeId))
    .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
    .leftJoin(schema.products, eq(schema.products.id, schema.sales.productId));

  const searchWhere = search
    ? or(
        like(schema.customers.name, `%${search}%`),
        like(schema.products.name, `%${search}%`),
        like(schema.representatives.name, `%${search}%`)
      )
    : undefined;

  const conditions = [scopeWhere, statusWhere, searchWhere].filter(Boolean);
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

  const [[{ total }], sales] = await Promise.all([countQuery, dataQuery]);

  return (
    <>
      <PageHeader
        title={isAdmin ? "Vendas" : "Minhas vendas"}
        description={`${total} venda(s) registrada(s)`}
        icon={Receipt}
        actions={
          <>
            {total > 0 && (
              <a href="/api/export/vendas">
                <Button variant="secondary">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </a>
            )}
            <Link href="/vendas/nova">
              <Button>
                <Plus className="h-4 w-4" />
                Nova venda
              </Button>
            </Link>
          </>
        }
      />
      <SalesList
        sales={sales}
        isAdmin={isAdmin}
        total={total}
        page={page}
        search={search}
        statusFilter={statusFilter}
      />
    </>
  );
}
