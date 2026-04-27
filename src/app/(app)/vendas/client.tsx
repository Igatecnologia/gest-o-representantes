"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Receipt,
  X,
  Calendar,
  User,
  Package,
  SlidersHorizontal,
  Download,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  Avatar,
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
import { cancelSaleAction } from "@/lib/actions/sales";

type SaleRow = {
  id: string;
  createdAt: Date | number;
  total: number;
  quantity: number;
  status: string;
  repName: string | null;
  customerName: string | null;
  customerId?: string | null;
  productName: string | null;
};

const STATUS_OPTIONS = [
  { id: "approved", label: "Aprovada", tone: "success" as const },
  { id: "pending", label: "Pendente", tone: "warning" as const },
  { id: "cancelled", label: "Cancelada", tone: "danger" as const },
];

const STATUS_TOPBAR: Record<string, string> = {
  approved: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  pending: "bg-gradient-to-r from-amber-500 to-amber-400",
  cancelled: "bg-gradient-to-r from-zinc-400 to-zinc-300",
};

const PER_PAGE = 20;

export function SalesList({
  sales,
  isAdmin,
  total,
  page,
  search,
  statusFilter,
  from,
  to,
}: {
  sales: SaleRow[];
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
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
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

  // URL pra exportar CSV respeitando filtros aplicados
  const exportUrl = (() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return `/api/export/vendas${qs ? `?${qs}` : ""}`;
  })();

  async function handleCancel() {
    if (!cancelId) return;
    setCancelling(true);
    const fd = new FormData();
    fd.set("id", cancelId);
    await cancelSaleAction(fd);
    toast.success("Venda cancelada");
    setCancelId(null);
    setCancelling(false);
  }

  const hasActiveDate = !!(from || to);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          defaultValue={search}
          onChange={handleSearch}
          placeholder="Buscar por cliente, produto, representante..."
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

      {sales.length === 0 ? (
        <EmptyState
          title={search || statusFilter ? "Nenhum resultado" : "Nenhuma venda registrada"}
          hint="Ajuste os filtros ou cadastre uma nova venda."
          icon={Receipt}
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {sales.map((s) => {
              const statusLabel = STATUS_OPTIONS.find((o) => o.id === s.status);
              const canCancel = s.status !== "cancelled";
              return (
                <div
                  key={s.id}
                  className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] ${
                      STATUS_TOPBAR[s.status] ?? STATUS_TOPBAR.pending
                    }`}
                  />

                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className="min-w-0 flex-1">
                      {s.customerId ? (
                        <Link
                          href={`/clientes/${s.customerId}`}
                          className="inline-flex items-center gap-1 truncate text-sm font-bold hover:text-[var(--color-primary)]"
                        >
                          {s.customerName ?? "—"}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      ) : (
                        <div className="truncate text-sm font-bold">
                          {s.customerName ?? "—"}
                        </div>
                      )}
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                        <Package className="h-3 w-3" />
                        <span className="truncate">{s.productName ?? "—"}</span>
                        {s.quantity > 1 && (
                          <span className="text-[var(--color-text-dim)]">
                            ×{s.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    {statusLabel && (
                      <Badge tone={statusLabel.tone}>{statusLabel.label}</Badge>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div className="flex flex-col gap-0.5 text-[10px] text-[var(--color-text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateShort(s.createdAt)}
                      </span>
                      {isAdmin && s.repName && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {s.repName}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--color-text-muted)]">Total</div>
                      <div className="text-base font-bold tabular-nums text-[var(--color-text)]">
                        {brl(s.total)}
                      </div>
                    </div>
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancelId(s.id)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-danger)]/10 px-3 py-2 text-xs font-medium text-[var(--color-danger)] active:bg-[var(--color-danger)]/20"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancelar venda
                    </button>
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
                  <TH>Data</TH>
                  {isAdmin && <TH>Representante</TH>}
                  <TH>Cliente</TH>
                  <TH>Produto</TH>
                  <TH>Qtd</TH>
                  <TH className="text-right">Total</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Ações</TH>
                </tr>
              </THead>
              <tbody>
                {sales.map((s) => (
                  <TR key={s.id}>
                    <TD className="text-[var(--color-text-muted)]">{dateShort(s.createdAt)}</TD>
                    {isAdmin && (
                      <TD>
                        <div className="flex items-center gap-2">
                          {s.repName && <Avatar name={s.repName} size="sm" />}
                          <span>{s.repName ?? "-"}</span>
                        </div>
                      </TD>
                    )}
                    <TD>{s.customerName ?? "-"}</TD>
                    <TD className="text-[var(--color-text-muted)]">{s.productName ?? "-"}</TD>
                    <TD className="tabular-nums">{s.quantity}</TD>
                    <TD className="text-right font-semibold tabular-nums">{brl(s.total)}</TD>
                    <TD>
                      {s.status === "approved" && <Badge tone="success">Aprovada</Badge>}
                      {s.status === "pending" && <Badge tone="warning">Pendente</Badge>}
                      {s.status === "cancelled" && <Badge tone="danger">Cancelada</Badge>}
                    </TD>
                    <TD className="text-right">
                      {s.status !== "cancelled" && (
                        <Button variant="ghost" size="sm" onClick={() => setCancelId(s.id)}>
                          <X className="h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                      )}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      <Pagination total={total} page={page} perPage={PER_PAGE} onChange={(p) => navigate({ page: p })} />

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancelar venda?"
        description="A comissão vinculada também será afetada."
        confirmLabel="Cancelar venda"
        danger
        loading={cancelling}
      />
    </>
  );
}
