import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Receipt, Plus, Download } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { requireScope } from "@/lib/auth";
import { SalesList } from "./client";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const { isAdmin, repId } = await requireScope();

  const where = isAdmin ? undefined : eq(schema.sales.representativeId, repId);

  const sales = await db
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
    .where(where)
    .orderBy(desc(schema.sales.createdAt));

  return (
    <>
      <PageHeader
        title={isAdmin ? "Vendas" : "Minhas vendas"}
        description={`${sales.length} venda(s) registrada(s)`}
        icon={Receipt}
        actions={
          <>
            {sales.length > 0 && (
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
      <SalesList sales={sales} isAdmin={isAdmin} />
    </>
  );
}
