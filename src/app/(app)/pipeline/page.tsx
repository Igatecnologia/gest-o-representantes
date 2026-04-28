import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, and, or, like, sql, asc, isNull } from "drizzle-orm";
import { DEAL_STAGES } from "@/lib/db/schema";
import { Button, PageHeader } from "@/components/ui";
import { KanbanBoard } from "./kanban-board";
import { Kanban, Plus } from "lucide-react";
import { requireScope } from "@/lib/auth";
import { getActivePipelines } from "@/lib/actions/pipelines";

export const dynamic = "force-dynamic";

type SortKey = "created" | "value" | "expectedClose" | "stale";
type ViewMode = "kanban" | "list";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    rep?: string;
    sort?: string;
    view?: string;
    funil?: string;
  }>;
}) {
  const { isAdmin, repId } = await requireScope();
  const params = await searchParams;
  const search = (params.q ?? "").trim();
  const repFilter = isAdmin ? (params.rep ?? "") : "";
  const sortKey = (params.sort as SortKey) || "created";
  const viewMode = (params.view as ViewMode) || "kanban";
  const funilFilter = params.funil ?? "";

  const scopeWhere = isAdmin ? undefined : eq(schema.deals.representativeId, repId);
  const repWhere = repFilter ? eq(schema.deals.representativeId, repFilter) : undefined;
  const funilWhere = funilFilter
    ? funilFilter === "default"
      ? isNull(schema.deals.pipelineId)
      : eq(schema.deals.pipelineId, funilFilter)
    : undefined;
  const searchWhere = search
    ? or(
        like(schema.deals.title, `%${search}%`),
        like(schema.customers.name, `%${search}%`),
      )
    : undefined;

  const conditions = [scopeWhere, repWhere, funilWhere, searchWhere].filter(Boolean);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orderClause = (() => {
    switch (sortKey) {
      case "value":
        return desc(schema.deals.value);
      case "expectedClose":
        // ASC, mas null vai pro fim
        return asc(schema.deals.expectedCloseDate);
      case "stale":
        // Mais antigos primeiro
        return asc(schema.deals.createdAt);
      case "created":
      default:
        return desc(schema.deals.createdAt);
    }
  })();

  const [rows, repsList, pipelines] = await Promise.all([
    db
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
        eq(schema.representatives.id, schema.deals.representativeId),
      )
      .where(whereClause)
      .orderBy(orderClause),
    // Lista de reps pra filtro (apenas admin)
    isAdmin
      ? db
          .select({
            id: schema.representatives.id,
            name: schema.representatives.name,
          })
          .from(schema.representatives)
          .where(eq(schema.representatives.active, true))
          .orderBy(schema.representatives.name)
      : Promise.resolve([] as { id: string; name: string }[]),
    getActivePipelines(),
  ]);

  // Marca deals "parados" — sem movimentação há 30+ dias na mesma stage.
  // Aproximação: usa createdAt do deal (não temos histórico de stage moves).
  // Para deals em won/lost, não marca (já fechados).
  const STALE_DAYS = 30;
  const now = Date.now();
  const staleThreshold = now - STALE_DAYS * 24 * 60 * 60 * 1000;
  const enriched = rows.map((d) => {
    const createdMs = new Date(d.createdAt).getTime();
    const daysInStage = Math.floor((now - createdMs) / (24 * 60 * 60 * 1000));
    return {
      ...d,
      daysInStage,
      isStale:
        d.stage !== "won" && d.stage !== "lost" && createdMs < staleThreshold,
    };
  });

  const byStage = DEAL_STAGES.map((s) => {
    const deals = enriched.filter((d) => d.stage === s.id);
    const total = deals.reduce((acc, d) => acc + d.value, 0);
    // Forecast = soma do valor × probability da stage (em decimal)
    const forecast = deals.reduce(
      (acc, d) => acc + d.value * (s.probability / 100),
      0,
    );
    return { ...s, deals, total, forecast };
  });

  // Forecast geral (soma só de stages abertas — won não conta como previsão)
  const grandForecast = byStage
    .filter((s) => s.id !== "won" && s.id !== "lost")
    .reduce((acc, s) => acc + s.forecast, 0);
  const wonTotal = byStage.find((s) => s.id === "won")?.total ?? 0;

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

      <KanbanBoard
        columns={byStage}
        search={search}
        repFilter={repFilter}
        reps={repsList}
        isAdmin={isAdmin}
        sortKey={sortKey}
        viewMode={viewMode}
        grandForecast={grandForecast}
        wonTotal={wonTotal}
        pipelines={pipelines}
        funilFilter={funilFilter}
      />
    </>
  );
}
