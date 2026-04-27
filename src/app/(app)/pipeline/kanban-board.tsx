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
};

type Column = {
  id: string;
  label: string;
  probability: number;
  deals: DealRow[];
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
}: {
  columns: Column[];
  search: string;
  repFilter: string;
  reps: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [cols, setCols] = React.useState(columns);
  const [activeDeal, setActiveDeal] = React.useState<DealRow | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setCols(columns);
  }, [columns]);

  function navigate(updates: Partial<{ q: string; rep: string }>) {
    const next = {
      q: updates.q ?? search,
      rep: updates.rep !== undefined ? updates.rep : repFilter,
    };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.rep) params.set("rep", next.rep);
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
      {/* Filtros */}
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
            className="md:w-[220px]"
          >
            <option value="">Todos os representantes</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        )}
        {staleCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {staleCount} negócio(s) parado(s) há 30+ dias
          </div>
        )}
      </div>

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
    </>
  );
}

function KanbanColumn({ column }: { column: Column }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const total = column.deals.reduce((acc, d) => acc + d.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[300px] shrink-0 flex-col rounded-[var(--radius-lg)] border bg-[var(--color-surface)] transition-colors",
        stageTone[column.id],
        isOver && "ring-2 ring-[var(--color-primary)]/40"
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          {column.id === "won" && <Trophy className="h-4 w-4 text-emerald-400" />}
          {column.id === "lost" && <XCircle className="h-4 w-4 text-red-400" />}
          <h3 className="text-sm font-semibold">{column.label}</h3>
          <Badge tone="default">{column.deals.length}</Badge>
        </div>
        <div className="text-xs tabular-nums text-[var(--color-text-muted)]">
          {brl(total)}
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

      <div className="flex items-center justify-between">
        {deal.repName && (
          <div className="flex items-center gap-1.5">
            <Avatar name={deal.repName} size="sm" />
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {deal.repName.split(" ")[0]}
            </span>
          </div>
        )}
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
            <Calendar className="h-3 w-3" />
            {dateShort(deal.expectedCloseDate)}
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
