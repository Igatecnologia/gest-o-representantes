"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Receipt, X } from "lucide-react";
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
  productName: string | null;
};

const STATUS_OPTIONS = [
  { id: "approved", label: "Aprovada", tone: "success" as const },
  { id: "pending", label: "Pendente", tone: "warning" as const },
  { id: "cancelled", label: "Cancelada", tone: "danger" as const },
];

const PER_PAGE = 20;

export function SalesList({
  sales,
  isAdmin,
  total,
  page,
  search,
  statusFilter,
}: {
  sales: SaleRow[];
  isAdmin: boolean;
  total: number;
  page: number;
  search: string;
  statusFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function navigate(newPage: number, newSearch?: string, newStatus?: string) {
    const s = newSearch ?? search;
    const st = newStatus ?? statusFilter;
    const params = new URLSearchParams();
    if (s) params.set("q", s);
    if (st) params.set("status", st);
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(1, value), 300);
  }

  function handleStatusChange(value: string) {
    navigate(1, undefined, value);
  }

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
      </div>

      {sales.length === 0 ? (
        <EmptyState
          title={search || statusFilter ? "Nenhum resultado" : "Nenhuma venda registrada"}
          hint="Ajuste os filtros ou cadastre uma nova venda."
          icon={Receipt}
        />
      ) : (
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
              <TH className="text-right">Acoes</TH>
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
      )}

      <Pagination total={total} page={page} perPage={PER_PAGE} onChange={(p) => navigate(p)} />

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancelar venda?"
        description="A comissao vinculada tambem sera afetada."
        confirmLabel="Cancelar venda"
        danger
        loading={cancelling}
      />
    </>
  );
}
