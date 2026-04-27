"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Wallet,
  Calendar,
  User,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  SearchInput,
  StatusFilter,
  Pagination,
  Table,
  THead,
  TH,
  TR,
  TD,
  ConfirmDialog,
} from "@/components/ui";
import { DateRangeFilter } from "@/components/date-range-filter";
import { brl, dateShort } from "@/lib/utils";
import { markCommissionPaidAction, revertCommissionAction } from "@/lib/actions/commissions";

type CommRow = {
  id: string;
  amount: number;
  status: string;
  paidAt: Date | number | null;
  createdAt: Date | number;
  saleTotal: number | null;
  repName: string | null;
  customerName: string | null;
};

const STATUS_OPTIONS = [
  { id: "pending", label: "Pendente" },
  { id: "paid", label: "Paga" },
];

const PER_PAGE = 20;

export function CommissionList({
  rows,
  isAdmin,
  total,
  page,
  search,
  statusFilter,
  from,
  to,
}: {
  rows: CommRow[];
  isAdmin: boolean;
  total: number;
  page: number;
  search: string;
  statusFilter: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [actionId, setActionId] = useState<{ id: string; action: "pay" | "revert" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(!!(from || to));
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function navigate(updates: Partial<{ page: number; q: string; status: string; from: string; to: string }>) {
    const next = {
      page: updates.page ?? 1,
      q: updates.q ?? search,
      status: updates.status ?? statusFilter,
      from: updates.from !== undefined ? updates.from : from,
      to: updates.to !== undefined ? updates.to : to,
    };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.status) params.set("status", next.status);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ q: value }), 300);
  }

  function handleStatusChange(value: string) {
    navigate({ status: value });
  }

  function handleDateApply(f: string, t: string) {
    navigate({ from: f, to: t });
  }

  function handleDateClear() {
    navigate({ from: "", to: "" });
  }

  const exportUrl = (() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return `/api/export/comissoes${qs ? `?${qs}` : ""}`;
  })();

  const hasActiveDate = !!(from || to);

  async function handleAction() {
    if (!actionId) return;
    setLoading(true);
    const fd = new FormData();
    fd.set("id", actionId.id);
    if (actionId.action === "pay") {
      await markCommissionPaidAction(fd);
      toast.success("Comissão marcada como paga");
    } else {
      await revertCommissionAction(fd);
      toast.success("Pagamento revertido");
    }
    setActionId(null);
    setLoading(false);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          defaultValue={search}
          onChange={handleSearch}
          placeholder="Buscar por representante ou cliente..."
          className="flex-1"
        />
        <StatusFilter options={STATUS_OPTIONS} value={statusFilter} onChange={handleStatusChange} />
        <Button
          size="sm"
          variant={showDateFilter || hasActiveDate ? "secondary" : "ghost"}
          onClick={() => setShowDateFilter((v) => !v)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Período
          {hasActiveDate && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white">
              ●
            </span>
          )}
        </Button>
        {total > 0 && (
          <a href={exportUrl}>
            <Button size="sm" variant="ghost">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </a>
        )}
      </div>

      {showDateFilter && (
        <div className="mb-4">
          <DateRangeFilter
            from={from}
            to={to}
            onApply={handleDateApply}
            onClear={handleDateClear}
          />
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title={search || statusFilter ? "Nenhum resultado" : "Nenhuma comissão gerada"}
          icon={Wallet}
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((c) => {
              const isPaid = c.status === "paid";
              return (
                <div
                  key={c.id}
                  className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] ${
                      isPaid
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : "bg-gradient-to-r from-amber-500 to-amber-400"
                    }`}
                  />

                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">
                        {c.customerName ?? "—"}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateShort(c.createdAt)}
                        </span>
                        {isAdmin && c.repName && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {c.repName}
                          </span>
                        )}
                      </div>
                    </div>
                    {isPaid ? (
                      <Badge tone="success">Paga</Badge>
                    ) : (
                      <Badge tone="warning">Pendente</Badge>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div className="text-[10px] text-[var(--color-text-muted)]">
                      <div>Venda</div>
                      <div className="text-xs font-medium tabular-nums text-[var(--color-text-muted)]">
                        {brl(c.saleTotal ?? 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--color-text-muted)]">Comissão</div>
                      <div
                        className={`text-base font-bold tabular-nums ${
                          isPaid ? "text-emerald-500" : "text-amber-500"
                        }`}
                      >
                        {brl(c.amount)}
                      </div>
                      {c.paidAt && (
                        <div className="text-[10px] text-[var(--color-text-dim)]">
                          pago em {dateShort(c.paidAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-3 flex gap-2 border-t border-[var(--color-border)] pt-3">
                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={() => setActionId({ id: c.id, action: "pay" })}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 active:bg-emerald-500/20"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Marcar paga
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActionId({ id: c.id, action: "revert" })}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] active:bg-[var(--color-surface-3)]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reverter pagamento
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <TH>Data venda</TH>
                  {isAdmin && <TH>Representante</TH>}
                  <TH>Cliente</TH>
                  <TH className="text-right">Venda</TH>
                  <TH className="text-right">Comissão</TH>
                  <TH>Status</TH>
                  <TH>Pago em</TH>
                  {isAdmin && <TH className="text-right">Ações</TH>}
                </tr>
              </THead>
              <tbody>
                {rows.map((c) => (
                  <TR key={c.id}>
                    <TD>{dateShort(c.createdAt)}</TD>
                    {isAdmin && <TD>{c.repName ?? "-"}</TD>}
                    <TD>{c.customerName ?? "-"}</TD>
                    <TD className="text-right">{brl(c.saleTotal ?? 0)}</TD>
                    <TD className="text-right font-medium">{brl(c.amount)}</TD>
                    <TD>
                      {c.status === "paid" ? (
                        <Badge tone="success">Paga</Badge>
                      ) : (
                        <Badge tone="warning">Pendente</Badge>
                      )}
                    </TD>
                    <TD>{dateShort(c.paidAt)}</TD>
                    {isAdmin && (
                      <TD className="text-right">
                        {c.status === "pending" ? (
                          <Button size="sm" onClick={() => setActionId({ id: c.id, action: "pay" })}>
                            Marcar paga
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setActionId({ id: c.id, action: "revert" })}>
                            Reverter
                          </Button>
                        )}
                      </TD>
                    )}
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      <Pagination total={total} page={page} perPage={PER_PAGE} onChange={(p) => navigate({ page: p })} />

      <ConfirmDialog
        open={!!actionId}
        onClose={() => setActionId(null)}
        onConfirm={handleAction}
        title={actionId?.action === "pay" ? "Marcar comissão como paga?" : "Reverter pagamento?"}
        description={
          actionId?.action === "pay"
            ? "A comissão será marcada como paga com a data atual."
            : "O status voltará para pendente."
        }
        confirmLabel={actionId?.action === "pay" ? "Confirmar pagamento" : "Reverter"}
        danger={actionId?.action === "revert"}
        loading={loading}
      />
    </>
  );
}
