import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireScope, getCurrentRep } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { FileText } from "lucide-react";
import { ProposalForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NovaPropostaPage() {
  const { isAdmin, repId, session } = await requireScope();

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
        title="Nova proposta"
        description="Crie uma proposta comercial para o cliente"
        icon={FileText}
      />
      <ProposalForm customers={customers} products={products} />
    </>
  );
}
