"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
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
}: {
  rows: CommRow[];
  isAdmin: boolean;
  total: number;
  page: number;
  search: string;
  statusFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [actionId, setActionId] = useState<{ id: string; action: "pay" | "revert" } | null>(null);
  const [loading, setLoading] = useState(false);
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

  async function handleAction() {
    if (!actionId) return;
    setLoading(true);
    const fd = new FormData();
    fd.set("id", actionId.id);
    if (actionId.action === "pay") {
      await markCommissionPaidAction(fd);
      toast.success("Comissao marcada como paga");
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
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={search || statusFilter ? "Nenhum resultado" : "Nenhuma comissao gerada"}
          icon={Wallet}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Data venda</TH>
              {isAdmin && <TH>Representante</TH>}
              <TH>Cliente</TH>
              <TH className="text-right">Venda</TH>
              <TH className="text-right">Comissao</TH>
              <TH>Status</TH>
              <TH>Pago em</TH>
              {isAdmin && <TH className="text-right">Acoes</TH>}
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
      )}

      <Pagination total={total} page={page} perPage={PER_PAGE} onChange={(p) => navigate(p)} />

      <ConfirmDialog
        open={!!actionId}
        onClose={() => setActionId(null)}
        onConfirm={handleAction}
        title={actionId?.action === "pay" ? "Marcar comissao como paga?" : "Reverter pagamento?"}
        description={
          actionId?.action === "pay"
            ? "A comissao sera marcada como paga com a data atual."
            : "O status voltara para pendente."
        }
        confirmLabel={actionId?.action === "pay" ? "Confirmar pagamento" : "Reverter"}
        danger={actionId?.action === "revert"}
        loading={loading}
      />
    </>
  );
}
