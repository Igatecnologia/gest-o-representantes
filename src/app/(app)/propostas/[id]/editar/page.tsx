import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { FileText } from "lucide-react";
import { EditProposalForm } from "./form";

export const dynamic = "force-dynamic";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isAdmin, repId } = await requireScope();

  const [proposal] = await db
    .select({
      id: schema.proposals.id,
      status: schema.proposals.status,
      customerId: schema.proposals.customerId,
      productId: schema.proposals.productId,
      representativeId: schema.proposals.representativeId,
      validUntil: schema.proposals.validUntil,
      notes: schema.proposals.notes,
    })
    .from(schema.proposals)
    .where(eq(schema.proposals.id, id))
    .limit(1);

  if (!proposal) notFound();
  if (!isAdmin && proposal.representativeId !== repId) notFound();
  if (proposal.status !== "draft") notFound();

  const items = await db
    .select()
    .from(schema.proposalItems)
    .where(eq(schema.proposalItems.proposalId, id));

  const customers = isAdmin
    ? await db.select({ id: schema.customers.id, name: schema.customers.name }).from(schema.customers)
    : await db
        .select({ id: schema.customers.id, name: schema.customers.name })
        .from(schema.customers)
        .where(eq(schema.customers.representativeId, repId!));

  const products = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      price: schema.products.price,
      implementationPrice: schema.products.implementationPrice,
      type: schema.products.type,
    })
    .from(schema.products)
    .where(eq(schema.products.active, true));

  return (
    <>
      <PageHeader
        title="Editar proposta"
        description="Altere os dados da proposta em rascunho"
        icon={FileText}
      />
      <EditProposalForm
        proposalId={proposal.id}
        initial={{
          customerId: proposal.customerId,
          productId: proposal.productId,
          validUntil: proposal.validUntil
            ? new Date(proposal.validUntil).toISOString().slice(0, 10)
            : "",
          notes: proposal.notes ?? "",
          items: items.map((i) => ({
            label: i.label,
            type: i.type as "one_time" | "monthly" | "yearly",
            defaultValue: i.defaultValue / 100,
            value: i.value / 100,
          })),
        }}
        customers={customers}
        products={products}
      />
    </>
  );
}
