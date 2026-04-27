"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  MessageSquare,
  History,
  ListChecks,
  X,
  Sparkles,
} from "lucide-react";
import { dateShort, dateLong, whatsappUrl } from "@/lib/utils";
import {
  completeFollowUpAction,
  skipFollowUpAction,
  deleteFollowUpAction,
} from "@/lib/actions/follow-ups";
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
  result: string | null;
  completedAt: Date | null;
  createdAt: Date | null;
};

type Counts = {
  today: number;
  week: number;
  month: number;
  overdue: number;
};

type Filter = "today" | "week" | "month" | "overdue" | "all";
type StatusFilter = "pending" | "done" | "skipped" | "all";

const PERIOD_FILTERS: { id: Filter; label: string; icon: typeof Clock; tone: "default" | "brand" | "danger" | "info" }[] = [
  { id: "overdue", label: "Atrasados", icon: AlertTriangle, tone: "danger" },
  { id: "today", label: "Hoje", icon: Clock, tone: "brand" },
  { id: "week", label: "Semana", icon: CalendarDays, tone: "info" },
  { id: "month", label: "Mês", icon: CalendarRange, tone: "default" },
  { id: "all", label: "Todos", icon: Calendar, tone: "default" },
];

const TYPE_TONE: Record<string, "default" | "brand" | "success" | "warning" | "info"> = {
  proposal_sent: "brand",
  negotiation: "warning",
  post_sale: "success",
  general: "default",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  done: "Feito",
  skipped: "Pulado",
};

const STATUS_TONES: Record<string, "default" | "brand" | "success" | "warning" | "info"> = {
  pending: "brand",
  done: "success",
  skipped: "default",
};

const TYPE_HINTS: Record<string, string> = {
  proposal_sent: "Olá! Tudo bem? Estou retornando sobre a proposta que te enviei. Conseguiu dar uma olhada? Posso esclarecer alguma dúvida?",
  negotiation: "Olá! Tudo certo? Passando para retomar nossa conversa. Conseguiu avaliar o que conversamos?",
  post_sale: "Olá! Como está sendo a experiência? Algum ponto que eu possa te ajudar?",
  general: "Olá! Tudo bem? Estou retornando o nosso contato. Quando seria um bom momento para conversarmos?",
};

function buildWhatsAppUrl(phone: string | null, message: string): string {
  const cleaned = (phone ?? "").replace(/\D/g, "");
  // Brasil: garante 55 no início se for número nacional (10-11 dígitos)
  const withCountry =
    cleaned.length >= 10 && !cleaned.startsWith("55")
      ? `55${cleaned}`
      : cleaned;
  const text = encodeURIComponent(message);
  return withCountry ? `https://wa.me/${withCountry}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function FollowUpList({
  followUps,
  counts,
  activeFilter,
  status,
  from,
  to,
}: {
  followUps: FollowUpItem[];
  counts: Counts;
  activeFilter: Filter;
  status: StatusFilter;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [fromInput, setFromInput] = useState(from);
  const [toInput, setToInput] = useState(to);

  const isHistory = status !== "pending";

  function buildQuery(updates: Partial<{ filter: Filter; status: StatusFilter; from: string; to: string }>) {
    const params = new URLSearchParams();
    const next = {
      filter: updates.filter ?? activeFilter,
      status: updates.status ?? status,
      from: updates.from !== undefined ? updates.from : from,
      to: updates.to !== undefined ? updates.to : to,
    };
    if (next.filter && next.filter !== "all") params.set("filter", next.filter);
    if (next.status && next.status !== "pending") params.set("status", next.status);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    const qs = params.toString();
    return qs ? `/retornos?${qs}` : "/retornos";
  }

  function go(updates: Parameters<typeof buildQuery>[0]) {
    startTransition(() => router.push(buildQuery(updates)));
  }

  function applyDateRange() {
    go({ from: fromInput, to: toInput });
  }

  function clearDateRange() {
    setFromInput("");
    setToInput("");
    go({ from: "", to: "" });
  }

  function getCountForFilter(id: Filter) {
    switch (id) {
      case "today": return counts.today;
      case "week": return counts.week;
      case "month": return counts.month;
      case "overdue": return counts.overdue;
      default: return 0;
    }
  }

  function isOverdue(date: Date | null, st: string) {
    if (!date || st !== "pending") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date).getTime() < today.getTime();
  }

  function openWhatsApp(fu: FollowUpItem) {
    const greeting = fu.customerName ? `Olá ${fu.customerName.split(" ")[0]}!` : "Olá!";
    const base = TYPE_HINTS[fu.type] ?? TYPE_HINTS.general;
    const message = base.replace(/^Olá!?\s*/i, `${greeting} `);
    const url = buildWhatsAppUrl(fu.customerPhone, message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      {/* TABS — Pendentes vs Histórico */}
      <div className="inline-flex rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1">
        <button
          onClick={() => go({ status: "pending", from: "", to: "" })}
          className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-1.5 text-xs font-semibold transition-all ${
            !isHistory
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Pendentes
          {counts.today + counts.overdue > 0 && !isHistory && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[9px] font-bold">
              {counts.today + counts.overdue}
            </span>
          )}
        </button>
        <button
          onClick={() => go({ status: "all", filter: "all" })}
          className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-1.5 text-xs font-semibold transition-all ${
            isHistory
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Histórico
        </button>
      </div>

      {/* Filtros — Pendentes mostra períodos; Histórico mostra status + range */}
      {!isHistory ? (
        <div className="flex flex-wrap gap-2">
          {PERIOD_FILTERS.map((f) => {
            const count = getCountForFilter(f.id);
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => go({ filter: f.id })}
                className={`group inline-flex items-center gap-2 rounded-[var(--radius)] border px-3.5 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? f.id === "overdue"
                      ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                      : "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                }`}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
                {count > 0 && (
                  <span
                    className={`ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      f.id === "overdue"
                        ? "bg-[var(--color-danger)]/20 text-[var(--color-danger)]"
                        : isActive
                        ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                        : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {([
              { id: "all", label: "Todos" },
              { id: "done", label: "Feitos" },
              { id: "skipped", label: "Pulados" },
              { id: "pending", label: "Pendentes" },
            ] as const).map((s) => {
              const isActive = status === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => go({ status: s.id })}
                  className={`inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-3.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Range de datas */}
          <Card className="bg-[var(--color-surface)]/50">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1.5 block text-[10px] font-medium text-[var(--color-text-muted)]">De</label>
                <Input
                  type="date"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1.5 block text-[10px] font-medium text-[var(--color-text-muted)]">Até</label>
                <Input
                  type="date"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={applyDateRange} disabled={!fromInput && !toInput}>
                <CalendarRange className="h-3.5 w-3.5" />
                Aplicar
              </Button>
              {(from || to) && (
                <Button size="sm" variant="ghost" onClick={clearDateRange}>
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>
            {(from || to) && (
              <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                Mostrando retornos {from && `de ${dateShort(new Date(from))}`}{" "}
                {to && `até ${dateShort(new Date(to))}`}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Lista de retornos */}
      {followUps.length === 0 ? (
        <EmptyState
          title={
            activeFilter === "overdue"
              ? "Nenhum retorno atrasado"
              : isHistory
              ? "Nenhum registro encontrado"
              : "Nenhum retorno agendado"
          }
          hint={
            activeFilter === "today"
              ? "Você não tem retornos para hoje. Bom trabalho!"
              : isHistory
              ? "Tente expandir o filtro de datas ou trocar o status."
              : "Sem retornos para este período."
          }
          icon={CalendarClock}
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {followUps.map((fu) => {
            const typeLabel = FOLLOWUP_TYPES.find((t) => t.id === fu.type)?.label ?? fu.type;
            const overdue = isOverdue(fu.scheduledDate, fu.status);
            const isExpanded = expandedId === fu.id;
            const isPending = fu.status === "pending";
            const hasPhone = !!fu.customerPhone;

            return (
              <FadeUp key={fu.id}>
                <Card
                  className={`group relative overflow-hidden transition-all ${
                    overdue
                      ? "border-[var(--color-danger)]/30 shadow-[0_0_0_1px_var(--color-danger)/20]"
                      : isPending
                      ? "hover:border-[var(--color-primary)]/30 hover:shadow-lg"
                      : "opacity-90"
                  }`}
                >
                  {/* Topbar de status — barra colorida no topo */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] ${
                      overdue
                        ? "bg-gradient-to-r from-[var(--color-danger)] to-red-400"
                        : fu.status === "done"
                        ? "bg-gradient-to-r from-[var(--color-success)] to-emerald-400"
                        : fu.status === "skipped"
                        ? "bg-gradient-to-r from-zinc-500 to-zinc-400"
                        : "bg-gradient-to-r from-[var(--color-primary)] to-violet-400"
                    }`}
                  />

                  {/* Header: cliente + status + tipo */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-[var(--color-text)]">
                        {fu.customerName ?? "Cliente"}
                      </h3>
                      {fu.customerPhone && (
                        <a
                          href={`tel:${fu.customerPhone}`}
                          className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                        >
                          <Phone className="h-3 w-3" />
                          {fu.customerPhone}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!isPending && (
                        <Badge tone={STATUS_TONES[fu.status] ?? "default"}>
                          {STATUS_LABELS[fu.status] ?? fu.status}
                        </Badge>
                      )}
                      <Badge tone={TYPE_TONE[fu.type] ?? "default"}>
                        {typeLabel}
                      </Badge>
                    </div>
                  </div>

                  {/* Data */}
                  <div
                    className={`mt-3 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-[11px] font-semibold ${
                      overdue
                        ? "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                        : isPending
                        ? "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    {fu.scheduledDate ? dateLong(fu.scheduledDate) : "—"}
                    {overdue && (
                      <span className="ml-1 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        atrasado
                      </span>
                    )}
                  </div>

                  {/* Por que vou retornar — destaque visual */}
                  {fu.notes && (
                    <div className="mt-3 rounded-[var(--radius-sm)] border-l-2 border-[var(--color-primary)]/40 bg-[var(--color-surface-2)]/50 px-3 py-2">
                      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                        <Sparkles className="h-2.5 w-2.5" />
                        Por que vou retornar
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--color-text)]">
                        {fu.notes}
                      </p>
                    </div>
                  )}

                  {/* O que aconteceu (se já foi feito) */}
                  {!isPending && fu.result && (
                    <div className="mt-3 rounded-[var(--radius-sm)] border-l-2 border-[var(--color-success)]/40 bg-[var(--color-success)]/5 px-3 py-2">
                      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-success)]">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        O que aconteceu
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--color-text)]">
                        {fu.result}
                      </p>
                      {fu.completedAt && (
                        <p className="mt-1 text-[10px] text-[var(--color-text-dim)]">
                          em {dateShort(fu.completedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Links pra contexto */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-[var(--color-text-dim)]">
                    {fu.proposalId && (
                      <a
                        href={`/propostas/${fu.proposalId}`}
                        className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                      >
                        <FileText className="h-3 w-3" /> Proposta
                      </a>
                    )}
                    {fu.dealId && (
                      <a
                        href={`/pipeline/${fu.dealId}/editar`}
                        className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                      >
                        <Kanban className="h-3 w-3" /> Deal
                      </a>
                    )}
                    {fu.repName && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> {fu.repName}
                      </span>
                    )}
                  </div>

                  {/* Ações — só pra retornos pendentes */}
                  {isPending && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openWhatsApp(fu)}
                        disabled={!hasPhone}
                        title={hasPhone ? "Abrir WhatsApp com mensagem" : "Cliente sem telefone cadastrado"}
                        className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-[#25D366] transition-all hover:bg-[#25D366]/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedId(isExpanded ? null : fu.id);
                          setResultText("");
                          setRescheduleDate("");
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-success)]/10 px-2.5 py-2 text-xs font-semibold text-[var(--color-success)] transition-colors hover:bg-[var(--color-success)]/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isExpanded ? "Fechar" : "Feito"}
                      </button>
                      <form action={skipFollowUpAction}>
                        <input type="hidden" name="id" value={fu.id} />
                        <button
                          type="submit"
                          title="Pular retorno"
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-2.5 py-2 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)]"
                        >
                          <SkipForward className="h-3.5 w-3.5" />
                        </button>
                      </form>
                      <form action={deleteFollowUpAction}>
                        <input type="hidden" name="id" value={fu.id} />
                        <button
                          type="submit"
                          title="Excluir retorno"
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-danger)]/10 px-2.5 py-2 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Form expandido — confirmar retorno */}
                  {isPending && isExpanded && (
                    <form
                      action={completeFollowUpAction}
                      className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-3"
                    >
                      <input type="hidden" name="id" value={fu.id} />
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)] mb-1 block">
                          O que aconteceu na conversa?
                        </label>
                        <Input
                          name="result"
                          placeholder="Ex: Cliente fechou! Vou enviar o contrato."
                          value={resultText}
                          onChange={(e) => setResultText(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[var(--color-text-muted)] mb-1 block">
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
