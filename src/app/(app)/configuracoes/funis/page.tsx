import { PageHeader } from "@/components/ui";
import { Kanban } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAllPipelines } from "@/lib/actions/pipelines";
import { PipelinesManager } from "./client";

export const dynamic = "force-dynamic";

export default async function FunisPage() {
  await requireAdmin();
  const pipelines = await getAllPipelines();

  return (
    <>
      <PageHeader
        title="Funis de venda"
        description="Crie funis separados pra contextos diferentes (prospecção, pós-venda, renovação...)"
        icon={Kanban}
      />
      <PipelinesManager pipelines={pipelines} />
    </>
  );
}
