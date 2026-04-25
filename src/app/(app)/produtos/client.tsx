"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Package, Pencil, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  SearchInput,
  StatusFilter,
  Table,
  THead,
  TH,
  TR,
  TD,
  ConfirmDialog,
} from "@/components/ui";
import { brl } from "@/lib/utils";
import { deleteProductAction } from "@/lib/actions/products";

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  type: string;
  active: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  perpetual: "Perpetua",
  subscription_monthly: "Mensal",
  subscription_yearly: "Anual",
};

const TYPE_TONE: Record<string, "default" | "brand" | "info"> = {
  perpetual: "default",
  subscription_monthly: "brand",
  subscription_yearly: "info",
};

const STATUS_OPTIONS = [
  { id: "active", label: "Ativo" },
  { id: "inactive", label: "Inativo" },
];

export function ProductList({ products }: { products: ProductRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const q = search.toLowerCase();
  const filtered = products.filter((p) => {
    if (statusFilter === "active" && !p.active) return false;
    if (statusFilter === "inactive" && p.active) return false;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const fd = new FormData();
    fd.set("id", deleteId);
    await deleteProductAction(fd);
    toast.success("Produto excluido");
    setDeleteId(null);
    setDeleting(false);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou SKU..." className="flex-1" />
        <StatusFilter options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search || statusFilter ? "Nenhum resultado" : "Nenhum produto cadastrado"}
          hint="Ajuste os filtros ou cadastre um produto."
          icon={Package}
          action={!search && !statusFilter ? <Link href="/produtos/novo"><Button size="sm">Cadastrar</Button></Link> : undefined}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Produto</TH>
              <TH>SKU</TH>
              <TH>Tipo</TH>
              <TH className="text-right">Preco</TH>
              <TH>Status</TH>
              <TH className="text-right">Acoes</TH>
            </tr>
          </THead>
          <tbody>
            {filtered.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">{p.name}</TD>
                <TD className="font-mono text-xs text-[var(--color-text-muted)]">{p.sku ?? "-"}</TD>
                <TD>
                  <Badge tone={TYPE_TONE[p.type]}>{TYPE_LABEL[p.type] ?? p.type}</Badge>
                </TD>
                <TD className="text-right font-semibold tabular-nums">{brl(p.price)}</TD>
                <TD>
                  {p.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="danger">Inativo</Badge>}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/produtos/${p.id}/editar`}>
                      <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir produto?"
        description="Vendas existentes que usam este produto serao afetadas."
        confirmLabel="Excluir"
        danger
        loading={deleting}
      />
    </>
  );
}
