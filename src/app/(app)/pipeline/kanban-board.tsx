"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { brl, cn, dateShort } from "@/lib/utils";
import { Avatar, Badge, SearchInput, Select } from "@/components/ui";
import { moveDealAction } from "@/lib/actions/deals";
import type { DealStage } from "@/lib/db/schema";
import {
  Calendar,
  Trophy,
  XCircle,
  ExternalLink,
  FileText,
  Pencil,
  AlertTriangle,
  TrendingUp,
  Kanban,
  List,
  Clock,
} from "lucide-react";

type DealRow = {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: Date | number | null;
  createdAt: Date | number;
  customerId: string;
  customerName: string | null;
  repId: string;
  repName: string | null;
  productId: string | null;
  isStale: boolean;
  daysInStage: number;
};

type Column = {
  id: string;
  label: string;
  probability: number;
  deals: DealRow[];
  total: number;
  forecast: number;
};

const stageTone: Record<string, string> = {
  lead: "border-zinc-500/30 bg-zinc-500/5",
  qualified: "border-blue-500/30 bg-blue-500/5",
  proposal: "border-violet-500/30 bg-violet-500/5",
  negotiation: "border-amber-500/30 bg-amber-500/5",
  won: "border-emerald-500/30 bg-emerald-500/5",
  lost: "border-red-500/30 bg-red-500/5",
};

export function KanbanBoard({
  columns,
  search,
  repFilter,
  reps,
  isAdmin,
  sortKey,
  viewMode,
  grandForecast,
  wonTotal,
  pipelines,
  funilFilter,
}: {
  columns: Column[];
  search: string;
  repFilter: string;
  reps: { id: string; name: string }[];
  isAdmin: boolean;
  sortKey: string;
  viewMode: "kanban" | "list";
  grandForecast: number;
  wonTotal: number;
  pipelines: { id: string; name: string; color: string }[];
  funilFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [cols, setCols] = React.useState(columns);
  const [activeDeal, setActiveDeal] = React.useState<DealRow | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setCols(columns);
  }, [columns]);

  function navigate(
    updates: Partial<{
      q: string;
      rep: string;
      sort: string;
      view: string;
      funil: string;
    }>,
  ) {
    const next = {
      q: updates.q ?? search,
      rep: updates.rep !== undefined ? updates.rep : repFilter,
      sort: updates.sort !== undefined ? updates.sort : sortKey,
      view: updates.view !== undefined ? updates.view : viewMode,
      funil: updates.funil !== undefined ? updates.funil : funilFilter,
    };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.rep) params.set("rep", next.rep);
    if (next.sort && next.sort !== "created") params.set("sort", next.sort);
    if (next.view && next.view !== "kanban") params.set("view", next.view);
    if (next.funil) params.set("funil", next.funil);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ q: value }), 300);
  }

  // Contagem de deals parados (visíveis no resultado filtrado)
  const staleCount = cols.reduce(
    (acc, c) => acc + c.deals.filter((d) => d.isStale).length,
    0,
  );
  const totalDealsCount = cols.reduce((acc, c) => acc + c.deals.length, 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const dealId = String(e.active.id);
    for (const col of cols) {
      const d = col.deals.find((x) => x.id === dealId);
      if (d) {
        setActiveDeal(d);
        return;
      }
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = e;
    if (!over) return;

    const dealId = String(active.id);
    const toStage = String(over.id) as DealStage;

    const fromCol = cols.find((c) => c.deals.some((d) => d.id === dealId));
    if (!fromCol || fromCol.id === toStage) return;

    // Optimistic update
    const deal = fromCol.deals.find((d) => d.id === dealId)!;
    const newCols = cols.map((c) => {
      if (c.id === fromCol.id) {
        return { ...c, deals: c.deals.filter((d) => d.id !== dealId) };
      }
      if (c.id === toStage) {
        return { ...c, deals: [{ ...deal, stage: toStage }, ...c.deals] };
      }
      return c;
    });
    setCols(newCols);

    const result = await moveDealAction({ dealId, toStage });
    if (result?.error) {
      toast.error(result.error);
      setCols(cols); // rollback
    } else {
      if (toStage === "won") {
        toast.success(`🎉 "${deal.title}" ganho — ${brl(deal.value)}`);
      } else if (toStage === "lost") {
        toast.info(`"${deal.title}" marcado como perdido`);
      } else {
        toast.success("Negócio movido");
      }
      router.refresh();
    }
  };

  return (
    <>
      {/* Seletor de funil — só aparece se admin definiu múltiplos */}
      {pipelines.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate({ funil: "" })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-3 py-1.5 text-xs font-medium transition-all",
              !funilFilter
                ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            Todos os funis
          </button>
          <button
            type="button"
            onClick={() => navigate({ funil: "default" })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-3 py-1.5 text-xs font-medium transition-all",
              funilFilter === "default"
                ? "border-[var(--color-text-muted)]/40 bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            Padrão
          </button>
          {pipelines.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate({ funil: p.id })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-3 py-1.5 text-xs font-medium transition-all",
                funilFilter === p.id
                  ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Forecast bar — visão executiva */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)]/10">
            <TrendingUp className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Previsão de receita
            </div>
            <div className="text-lg font-bold tabular-nums leading-tight">
              {brl(grandForecast)}
            </div>
            <div className="text-[10px] text-[var(--color-text-dim)]">
              valor × probabilidade das stages abertas
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] border-l-[3px] border-l-emerald-500 bg-[var(--color-surface)] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
            <Trophy className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Ganhos (acumulado)
            </div>
            <div className="text-lg font-bold tabular-nums leading-tight text-emerald-600">
              {brl(wonTotal)}
            </div>
            <div className="text-[10px] text-[var(--color-text-dim)]">
              negócios fechados
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] border-l-[3px] border-l-[var(--color-text-muted)] bg-[var(--color-surface)] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-2)]">
            <Kanban className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Total de negócios
            </div>
            <div className="text-lg font-bold tabular-nums leading-tight">
              {totalDealsCount}
            </div>
            <div className="text-[10px] text-[var(--color-text-dim)]">
              {staleCount > 0 ? `${staleCount} parado(s)` : "todos ativos"}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros + sort + view toggle */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          defaultValue={search}
          onChange={handleSearch}
          placeholder="Buscar por título do negócio ou cliente..."
          className="flex-1"
        />
        {isAdmin && reps.length > 0 && (
          <Select
            value={repFilter}
            onChange={(e) => navigate({ rep: e.target.value })}
            className="md:w-[180px]"
          >
            <option value="">Todos representantes</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={sortKey}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="md:w-[180px]"
        >
          <option value="created">Mais recentes</option>
          <option value="value">Maior valor</option>
          <option value="expectedClose">Próx. fechamento</option>
          <option value="stale">Mais antigos</option>
        </Select>

        {/* View toggle Kanban / Lista */}
        <div className="inline-flex rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5">
          <button
            onClick={() => navigate({ view: "kanban" })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "kanban"
                ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-text-muted)]",
            )}
            aria-pressed={viewMode === "kanban"}
          >
            <Kanban className="h-3.5 w-3.5" />
            Kanban
          </button>
          <button
            onClick={() => navigate({ view: "list" })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "list"
                ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-text-muted)]",
            )}
            aria-pressed={viewMode === "list"}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <DealListView columns={cols} />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {cols.map((col) => (
              <KanbanColumn key={col.id} column={col} />
            ))}
          </div>

          <DragOverlay>
            {activeDeal ? <KanbanCard deal={activeDeal} dragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}

function KanbanColumn({ column }: { column: Column }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const isTerminal = column.id === "won" || column.id === "lost";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[300px] shrink-0 flex-col rounded-[var(--radius-lg)] border bg-[var(--color-surface)] transition-colors",
        stageTone[column.id],
        isOver && "ring-2 ring-[var(--color-primary)]/40",
      )}
    >
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {column.id === "won" && <Trophy className="h-4 w-4 text-emerald-500" />}
            {column.id === "lost" && <XCircle className="h-4 w-4 text-red-500" />}
            <h3 className="text-sm font-semibold">{column.label}</h3>
          </div>
          <Badge tone="default">{column.deals.length}</Badge>
        </div>
        {/* Value totals */}
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold tabular-nums text-[var(--color-text)]">
            {brl(column.total)}
          </span>
          {!isTerminal && column.deals.length > 0 && (
            <span
              className="text-[10px] tabular-nums text-[var(--color-text-muted)]"
              title={`Forecast = soma × ${column.probability}% probabilidade`}
            >
              ~{brl(column.forecast)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {column.deals.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-xs text-[var(--color-text-dim)]">
            Solte um negócio aqui
          </div>
        ) : (
          column.deals.map((deal) => <KanbanCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}

function KanbanCard({ deal, dragging = false }: { deal: DealRow; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative cursor-grab active:cursor-grabbing rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 shadow-sm transition-all",
        "hover:border-[var(--color-border-strong)] hover:shadow-md",
        deal.isStale && "border-amber-500/40",
        (isDragging || dragging) && "opacity-60 shadow-lg ring-1 ring-[var(--color-primary)]/40",
      )}
      title={deal.isStale ? "Negócio parado há mais de 30 dias" : undefined}
    >
      {deal.isStale && (
        <div
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 shadow-sm"
          aria-label="Negócio parado"
        >
          <AlertTriangle className="h-2.5 w-2.5 text-white" />
        </div>
      )}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="flex-1 text-sm font-medium leading-snug">{deal.title}</h4>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--color-primary)]">
          {brl(deal.value)}
        </span>
      </div>

      <div className="mb-2 truncate text-xs text-[var(--color-text-muted)]">
        {deal.customerName ?? "-"}
      </div>

      {/* Dias no stage + expected close */}
      <div className="mb-2 flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
            deal.isStale
              ? "bg-amber-500/15 text-amber-600"
              : "bg-[var(--color-surface-3)]/70",
          )}
          title="Dias desde criação"
        >
          <Clock className="h-2.5 w-2.5" />
          {deal.daysInStage}d
        </span>
        {deal.expectedCloseDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {dateShort(deal.expectedCloseDate)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {deal.repName && (
          <div className="flex items-center gap-1.5">
            <Avatar name={deal.repName} size="sm" />
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {deal.repName.split(" ")[0]}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
          <div
            className="h-full rounded-full bg-gradient-brand"
            style={{ width: `${deal.probability}%` }}
          />
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {deal.productId && deal.stage !== "won" && deal.stage !== "lost" && (
            <Link
              href={`/propostas/nova?customerId=${deal.customerId}&productId=${deal.productId}`}
              className="text-[var(--color-text-dim)] hover:text-emerald-400"
              onClick={(e) => e.stopPropagation()}
              title="Criar proposta"
            >
              <FileText className="h-3 w-3" />
            </Link>
          )}
          <Link
            href={`/pipeline/${deal.id}/editar`}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-primary)]"
            onClick={(e) => e.stopPropagation()}
            title="Editar negócio"
          >
            <Pencil className="h-3 w-3" />
          </Link>
          <Link
            href={`/clientes/${deal.customerId}`}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-primary)]"
            onClick={(e) => e.stopPropagation()}
            title="Ver cliente"
          >
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============= LIST VIEW ============= */

const STAGE_TONE_PILL: Record<string, string> = {
  lead: "bg-zinc-500/10 text-zinc-600",
  qualified: "bg-blue-500/10 text-blue-600",
  proposal: "bg-violet-500/10 text-violet-600",
  negotiation: "bg-amber-500/10 text-amber-600",
  won: "bg-emerald-500/10 text-emerald-600",
  lost: "bg-red-500/10 text-red-600",
};

function DealListView({ columns }: { columns: Column[] }) {
  // Achata todos os deals em ordem do server (já vem ordenado por sortKey)
  const allDeals = columns.flatMap((c) => c.deals);

  if (allDeals.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-dim)]">
        Nenhum negócio para exibir.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[1fr_180px_120px_120px_120px_100px] items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        <div>Negócio</div>
        <div>Stage</div>
        <div className="text-right">Valor</div>
        <div className="text-right">Forecast</div>
        <div>Dias</div>
        <div className="text-right">Ações</div>
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {allDeals.map((d) => {
          const stageLabel =
            columns.find((c) => c.id === d.stage)?.label ?? d.stage;
          const forecast = d.value * (d.probability / 100);
          return (
            <li
              key={d.id}
              className={cn(
                "grid grid-cols-1 items-center gap-2 px-4 py-3 transition-colors hover:bg-[var(--color-surface-2)]/40 md:grid-cols-[1fr_180px_120px_120px_120px_100px] md:gap-4",
                d.isStale && "bg-amber-500/5",
              )}
            >
              <div className="min-w-0">
                <Link
                  href={`/pipeline/${d.id}/editar`}
                  className="block truncate text-sm font-semibold hover:text-[var(--color-primary)]"
                >
                  {d.title}
                </Link>
                <div className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                  {d.customerName ?? "—"}
                  {d.repName && (
                    <span className="ml-2 text-[var(--color-text-dim)]">
                      · {d.repName.split(" ")[0]}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                    STAGE_TONE_PILL[d.stage] ?? STAGE_TONE_PILL.lead,
                  )}
                >
                  {stageLabel}
                </span>
              </div>

              <div className="text-right text-sm font-semibold tabular-nums">
                {brl(d.value)}
              </div>
              <div className="text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                {d.stage !== "won" && d.stage !== "lost" ? brl(forecast) : "—"}
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 tabular-nums",
                    d.isStale
                      ? "bg-amber-500/15 text-amber-600 font-semibold"
                      : "text-[var(--color-text-muted)]",
                  )}
                >
                  {d.isStale && <AlertTriangle className="h-2.5 w-2.5" />}
                  {d.daysInStage}d
                </span>
              </div>

              <div className="flex justify-end gap-1.5">
                <Link
                  href={`/pipeline/${d.id}/editar`}
                  className="text-[var(--color-text-dim)] hover:text-[var(--color-primary)]"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/clientes/${d.customerId}`}
                  className="text-[var(--color-text-dim)] hover:text-[var(--color-primary)]"
                  title="Ver cliente"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
