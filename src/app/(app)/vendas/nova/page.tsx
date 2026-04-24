import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui";
import { SaleForm } from "./form";
import { requireScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const { isAdmin, repId } = await requireScope();

  const repsQuery = db
    .select({
      id: schema.representatives.id,
      name: schema.representatives.name,
      commissionPct: schema.representatives.commissionPct,
    })
    .from(schema.representatives)
    .where(eq(schema.representatives.active, true))
    .orderBy(asc(schema.representatives.name));

  const customersQuery = db
    .select({ id: schema.customers.id, name: schema.customers.name })
    .from(schema.customers);

  const [reps, customers, products] = await Promise.all([
    // Rep só vê ele próprio na lista (e form esconde select)
    isAdmin ? repsQuery : repsQuery.where(eq(schema.representatives.id, repId)),
    isAdmin
      ? customersQuery.orderBy(asc(schema.customers.name))
      : customersQuery
          .where(eq(schema.customers.representativeId, repId))
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
