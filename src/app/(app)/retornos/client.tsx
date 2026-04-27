"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui";
import { FadeUp, StaggerContainer } from "@/components/motion";
import {
  CalendarClock,
  CheckCircle2,
  Phone,
  Clock,
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Calendar,
  SkipForward,
  Trash2,
  FileText,
  Kanban,
  User,
} from "lucide-react";
import { dateShort } from "@/lib/utils";
import { completeFollowUpAction, skipFollowUpAction, deleteFollowUpAction } from "@/lib/actions/follow-ups";
import { FOLLOWUP_TYPES } from "@/lib/db/schema";

type FollowUpItem = {
  id: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  representativeId: string;
  repName: string | null;
  proposalId: string | null;
  dealId: string | null;
  scheduledDate: Date | null;
  type: string;
  status: string;
  notes: string | null;
  createdAt: Date | null;
};

type Counts = {
  today: number;
  week: number;
  month: number;
  overdue: number;
};

const FILTERS = [
  { id: "overdue", label: "Atrasados", icon: AlertTriangle, tone: "danger" as const },
  { id: "today", label: "Hoje", icon: Clock, tone: "brand" as const },
  { id: "week", label: "Semana", icon: CalendarDays, tone: "info" as const },
  { id: "month", label: "Mês", icon: CalendarRange, tone: "default" as const },
  { id: "all", label: "Todos", icon: Calendar, tone: "default" as const },
];

const TYPE_TONE: Record<string, "default" | "brand" | "success" | "warning" | "info"> = {
  proposal_sent: "brand",
  negotiation: "warning",
  post_sale: "success",
  general: "default",
};

export function FollowUpList({
  followUps,
  counts,
  activeFilter,
}: {
  followUps: FollowUpItem[];
  counts: Counts;
  activeFilter: string;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");

  function setFilter(f: string) {
    router.push(`/retornos?filter=${f}`);
  }

  function getCountForFilter(id: string) {
    switch (id) {
      case "today": return counts.today;
      case "week": return counts.week;
      case "month": return counts.month;
      case "overdue": return counts.overdue;
      default: return 0;
    }
  }

  function isOverdue(date: Date | null) {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date).getTime() < today.getTime();
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = getCountForFilter(f.id);
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)]"
              }`}
            >
              <f.icon className="h-3.5 w-3.5" />
              {f.label}
              {count > 0 && (
                <span className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                  f.id === "overdue" && count > 0
                    ? "bg-[var(--color-danger)]/20 text-[var(--color-danger)]"
                    : isActive
                    ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-3)] text-[var(--color-text-muted)]"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {followUps.length === 0 ? (
        <EmptyState
          title={activeFilter === "overdue" ? "Nenhum retorno atrasado" : "Nenhum retorno agendado"}
          hint={activeFilter === "today" ? "Você não tem retornos para hoje. Bom trabalho!" : "Sem retornos para este período."}
          icon={CalendarClock}
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {followUps.map((fu) => {
            const typeLabel = FOLLOWUP_TYPES.find((t) => t.id === fu.type)?.label ?? fu.type;
            const overdue = isOverdue(fu.scheduledDate);
            const isExpanded = expandedId === fu.id;

            return (
              <FadeUp key={fu.id}>
                <Card className={`relative overflow-hidden ${overdue ? "border-red-500/30" : ""}`}>
                  {overdue && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400" />
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">
                        {fu.customerName ?? "Cliente"}
                      </h3>
                      {fu.customerPhone && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                          <Phone className="h-3 w-3" />
                          {fu.customerPhone}
                        </div>
                      )}
                    </div>
                    <Badge tone={TYPE_TONE[fu.type] ?? "default"}>
                      {typeLabel}
                    </Badge>
                  </div>

                  {/* Data */}
                  <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${
                    overdue ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"
                  }`}>
                    <CalendarClock className="h-3.5 w-3.5" />
                    {overdue && <AlertTriangle className="h-3 w-3" />}
                    {fu.scheduledDate ? dateShort(fu.scheduledDate) : "—"}
                    {overdue && <span className="text-[var(--color-danger)]">(atrasado)</span>}
                  </div>

                  {/* Notas */}
                  {fu.notes && (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)] line-clamp-2">
                      {fu.notes}
                    </p>
                  )}

                  {/* Links */}
                  <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--color-text-dim)]">
                    {fu.proposalId && (
                      <a href={`/propostas/${fu.proposalId}`} className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
                        <FileText className="h-3 w-3" /> Proposta
                      </a>
                    )}
                    {fu.dealId && (
                      <a href={`/pipeline/${fu.dealId}/editar`} className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
                        <Kanban className="h-3 w-3" /> Deal
                      </a>
                    )}
                    {fu.repName && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> {fu.repName}
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setExpandedId(isExpanded ? null : fu.id);
                        setResultText("");
                        setRescheduleDate("");
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-success)]/10 px-2.5 py-2 text-xs font-medium text-[var(--color-success)] transition-colors hover:bg-[var(--color-success)]/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Feito
                    </button>
                    <form action={skipFollowUpAction}>
                      <input type="hidden" name="id" value={fu.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-2.5 py-2 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-3)]"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <form action={deleteFollowUpAction}>
                      <input type="hidden" name="id" value={fu.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-danger)]/10 px-2.5 py-2 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Formulário expandido — marcar como feito */}
                  {isExpanded && (
                    <form action={completeFollowUpAction} className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-3">
                      <input type="hidden" name="id" value={fu.id} />
                      <Input
                        name="result"
                        placeholder="O que aconteceu? (opcional)"
                        value={resultText}
                        onChange={(e) => setResultText(e.target.value)}
                      />
                      <div>
                        <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">
                          Reagendar? (opcional)
                        </label>
                        <Input
                          name="rescheduleDate"
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                        />
                      </div>
                      <Button type="submit" size="sm" className="w-full">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirmar retorno
                      </Button>
                    </form>
                  )}
                </Card>
              </FadeUp>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
