import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { DEAL_STAGES } from "@/lib/db/schema";
import { Button, PageHeader } from "@/components/ui";
import { KanbanBoard } from "./kanban-board";
import { Kanban, Plus } from "lucide-react";
import { requireScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { isAdmin, repId } = await requireScope();

  const where = isAdmin ? undefined : eq(schema.deals.representativeId, repId);

  const rows = await db
    .select({
      id: schema.deals.id,
      title: schema.deals.title,
      value: schema.deals.value,
      stage: schema.deals.stage,
      probability: schema.deals.probability,
      expectedCloseDate: schema.deals.expectedCloseDate,
      createdAt: schema.deals.createdAt,
      customerId: schema.deals.customerId,
      customerName: schema.customers.name,
      repId: schema.deals.representativeId,
      repName: schema.representatives.name,
      productId: schema.deals.productId,
    })
    .from(schema.deals)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.deals.customerId))
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.deals.representativeId)
    )
    .where(where)
    .orderBy(desc(schema.deals.createdAt));

  const byStage = DEAL_STAGES.map((s) => ({
    ...s,
    deals: rows.filter((d) => d.stage === s.id),
  }));

  return (
    <>
      <PageHeader
        title={isAdmin ? "Pipeline" : "Meu pipeline"}
        description="Acompanhe seus negócios em cada etapa"
        icon={Kanban}
        actions={
          <Link href="/pipeline/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo negócio
            </Button>
          </Link>
        }
      />

      <KanbanBoard columns={byStage} />
    </>
  );
}
