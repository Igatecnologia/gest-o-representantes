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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { brl, cn, dateShort } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui";
import { moveDealAction } from "@/lib/actions/deals";
import type { DealStage } from "@/lib/db/schema";
import { Calendar, Trophy, XCircle, ExternalLink, FileText, Pencil } from "lucide-react";

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

export function KanbanBoard({ columns }: { columns: Column[] }) {
  const router = useRouter();
  const [cols, setCols] = React.useState(columns);
  const [activeDeal, setActiveDeal] = React.useState<DealRow | null>(null);

  React.useEffect(() => {
    setCols(columns);
  }, [columns]);

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
        "group cursor-grab active:cursor-grabbing rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 shadow-sm transition-all",
        "hover:border-[var(--color-border-strong)] hover:shadow-md",
        (isDragging || dragging) && "opacity-60 shadow-lg ring-1 ring-[var(--color-primary)]/40"
      )}
    >
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
