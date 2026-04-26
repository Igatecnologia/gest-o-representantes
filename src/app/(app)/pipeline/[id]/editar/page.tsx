import { db, schema } from "@/lib/db";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { Kanban } from "lucide-react";
import { requireScope } from "@/lib/auth";
import { EditDealForm } from "./form";

export const dynamic = "force-dynamic";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isAdmin, repId } = await requireScope();

  const whereClause = isAdmin
    ? eq(schema.deals.id, id)
    : and(eq(schema.deals.id, id), eq(schema.deals.representativeId, repId));

  const [deal] = await db
    .select()
    .from(schema.deals)
    .where(whereClause)
    .limit(1);

  if (!deal) notFound();

  const repFilters = isAdmin
    ? eq(schema.representatives.active, true)
    : and(eq(schema.representatives.active, true), eq(schema.representatives.id, repId!));

  const customerFilters = isAdmin
    ? undefined
    : eq(schema.customers.representativeId, repId!);

  const [reps, customers, products] = await Promise.all([
    db
      .select({ id: schema.representatives.id, name: schema.representatives.name })
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
      <PageHeader title="Editar negócio" icon={Kanban} />
      <EditDealForm
        deal={deal}
        reps={reps}
        customers={customers}
        products={products}
        isAdmin={isAdmin}
      />
    </>
  );
}
