import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CalendarClock } from "lucide-react";
import { NewFollowUpForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NovoRetornoPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; proposalId?: string; dealId?: string }>;
}) {
  const { isAdmin, repId } = await requireScope();
  const params = await searchParams;

  // Buscar clientes do rep (sem .where(undefined) — Turso pode não aceitar)
  const customers = isAdmin
    ? await db
        .select({ id: schema.customers.id, name: schema.customers.name })
        .from(schema.customers)
        .orderBy(schema.customers.name)
    : await db
        .select({ id: schema.customers.id, name: schema.customers.name })
        .from(schema.customers)
        .where(eq(schema.customers.representativeId, repId!))
        .orderBy(schema.customers.name);

  return (
    <>
      <PageHeader
        title="Novo retorno"
        description="Agende um retorno com um cliente"
        icon={CalendarClock}
      />
      <NewFollowUpForm
        customers={customers}
        defaultCustomerId={params.customerId}
        defaultProposalId={params.proposalId}
        defaultDealId={params.dealId}
      />
    </>
  );
}
