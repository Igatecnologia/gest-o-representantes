"use client";

import { useState } from "react";
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

export function SalesList({
  sales,
  isAdmin,
}: {
  sales: SaleRow[];
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const PER_PAGE = 20;

  const q = search.toLowerCase();
  const allFiltered = sales.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    return (
      (s.customerName?.toLowerCase().includes(q) ?? false) ||
      (s.productName?.toLowerCase().includes(q) ?? false) ||
      (s.repName?.toLowerCase().includes(q) ?? false)
    );
  });
  const filtered = allFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
          value={search}
          onChange={setSearch}
          placeholder="Buscar por cliente, produto, representante..."
          className="flex-1"
        />
        <StatusFilter options={STATUS_OPTIONS} value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
      </div>

      {filtered.length === 0 ? (
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
            {filtered.map((s) => (
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

      <Pagination total={allFiltered.length} page={page} perPage={PER_PAGE} onChange={setPage} />

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
