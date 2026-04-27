"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { FileText, ChevronRight, SlidersHorizontal } from "lucide-react";
import {
  Badge,
  Button,
  Card,
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
import { PROPOSAL_STATUSES } from "@/lib/db/schema";
import { deleteProposalAction } from "@/lib/actions/proposals";

type ProposalRow = {
  id: string;
  status: string;
  validUntil: Date | number | null;
  createdAt: Date | number;
  customerId: string;
  customerName: string | null;
  repName: string | null;
  productName: string | null;
};

const STATUS_TONE: Record<string, "default" | "brand" | "success" | "warning" | "danger"> = {
  draft: "default",
  sent: "brand",
  accepted: "success",
  rejected: "danger",
  expired: "warning",
};

const STATUS_FILTER_OPTIONS = PROPOSAL_STATUSES.map((s) => ({
  id: s.id,
  label: s.label,
}));

const PER_PAGE = 20;

export function ProposalList({
  proposals,
  totalsMap,
  isAdmin,
  total,
  page,
  search,
  statusFilter,
  from,
  to,
}: {
  proposals: ProposalRow[];
  totalsMap: Record<string, { oneTime: number; monthly: number }>;
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const hasActiveDate = !!(from || to);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const fd = new FormData();
    fd.set("id", deleteId);
    await deleteProposalAction(fd);
    toast.success("Proposta excluida");
    setDeleteId(null);
    setDeleting(false);
  }

  if (total === 0 && !search && !statusFilter) {
    return (
      <Card>
        <EmptyState
          title="Nenhuma proposta ainda"
          hint="Crie uma proposta comercial para um cliente"
          icon={FileText}
          action={
            <Link href="/propostas/nova">
              <Button size="sm">Criar proposta</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          defaultValue={search}
          onChange={handleSearch}
          placeholder="Buscar por cliente, sistema, representante..."
          className="flex-1"
        />
        <StatusFilter options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={handleStatusChange} />
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

      {proposals.length === 0 ? (
        <EmptyState title="Nenhum resultado" hint="Ajuste a busca ou filtro." icon={FileText} />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {proposals.map((p) => {
              const totals = totalsMap[p.id] ?? { oneTime: 0, monthly: 0 };
              const statusMeta = PROPOSAL_STATUSES.find((s) => s.id === p.status);
              return (
                <Link key={p.id} href={`/propostas/${p.id}`}>
                  <Card className="active:scale-[0.98] transition-transform">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{p.customerName ?? "—"}</span>
                          <Badge tone={STATUS_TONE[p.status] ?? "default"} className="shrink-0">
                            {statusMeta?.label ?? p.status}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                          {p.productName ?? "—"}
                          {isAdmin && p.repName ? ` · ${p.repName}` : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-dim)] mt-1" />
                    </div>

                    <div className="mt-3 flex items-center gap-4 border-t border-[var(--color-border)] pt-3">
                      {totals.oneTime > 0 && (
                        <div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">Implantacao</div>
                          <div className="text-sm font-semibold tabular-nums">{brl(totals.oneTime)}</div>
                        </div>
                      )}
                      {totals.monthly > 0 && (
                        <div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">Mensal</div>
                          <div className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">{brl(totals.monthly)}</div>
                        </div>
                      )}
                      <div className="ml-auto text-right">
                        <div className="text-[10px] text-[var(--color-text-muted)]">Criada em</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{dateShort(p.createdAt)}</div>
                      </div>
                    </div>

                    {p.status === "draft" && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setDeleteId(p.id); }}
                          className="relative z-10 text-[11px] text-[var(--color-text-muted)] hover:text-red-400"
                        >
                          Excluir rascunho
                        </button>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <TH>Data</TH>
                  {isAdmin && <TH>Representante</TH>}
                  <TH>Cliente</TH>
                  <TH>Sistema</TH>
                  <TH>Implantacao</TH>
                  <TH>Mensal</TH>
                  <TH>Validade</TH>
                  <TH>Status</TH>
                  <TH>{" "}</TH>
                </tr>
              </THead>
              <tbody>
                {proposals.map((p) => {
                  const totals = totalsMap[p.id] ?? { oneTime: 0, monthly: 0 };
                  const statusMeta = PROPOSAL_STATUSES.find((s) => s.id === p.status);
                  return (
                    <TR key={p.id}>
                      <TD className="text-[var(--color-text-muted)]">{dateShort(p.createdAt)}</TD>
                      {isAdmin && <TD>{p.repName ?? "—"}</TD>}
                      <TD className="font-medium">{p.customerName ?? "—"}</TD>
                      <TD>{p.productName ?? "—"}</TD>
                      <TD className="tabular-nums">{brl(totals.oneTime)}</TD>
                      <TD className="tabular-nums">{brl(totals.monthly)}</TD>
                      <TD className="text-[var(--color-text-muted)]">
                        {p.validUntil ? dateShort(p.validUntil) : "—"}
                      </TD>
                      <TD>
                        <Badge tone={STATUS_TONE[p.status] ?? "default"}>
                          {statusMeta?.label ?? p.status}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/propostas/${p.id}`}
                            className="text-xs text-[var(--color-primary)] hover:underline"
                          >
                            Ver
                          </Link>
                          {p.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => setDeleteId(p.id)}
                              className="text-xs text-[var(--color-text-muted)] hover:text-red-400"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      <Pagination total={total} page={page} perPage={PER_PAGE} onChange={(p) => navigate({ page: p })} />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir proposta?"
        description="Esta acao nao pode ser desfeita."
        confirmLabel="Excluir"
        danger
        loading={deleting}
      />
    </>
  );
}
