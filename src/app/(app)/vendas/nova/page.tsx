import { db, schema } from "@/lib/db";
import { and, asc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui";
import { SaleForm } from "./form";
import { requireScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const { isAdmin, repId } = await requireScope();

  const repFilters = isAdmin
    ? eq(schema.representatives.active, true)
    : and(eq(schema.representatives.active, true), eq(schema.representatives.id, repId!));

  const customerFilters = isAdmin
    ? undefined
    : eq(schema.customers.representativeId, repId!);

  const [reps, customers, products] = await Promise.all([
    db
      .select({
        id: schema.representatives.id,
        name: schema.representatives.name,
        commissionPct: schema.representatives.commissionPct,
      })
      .from(schema.representatives)
      .where(repFilters)
      .orderBy(asc(schema.representatives.name)),
    db
      .select({ id: schema.customers.id, name: schema.customers.name })
      .from(schema.customers)
      .where(customerFilters)
      .orderBy(asc(schema.customers.name)),
    db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        price: schema.products.price,
      })
      .from(schema.products)
      .where(eq(schema.products.active, true))
      .orderBy(asc(schema.products.name)),
  ]);

  return (
    <>
      <PageHeader title="Nova venda" />
      <SaleForm
        reps={reps}
        customers={customers}
        products={products}
        isAdmin={isAdmin}
      />
    </>
  );
}
