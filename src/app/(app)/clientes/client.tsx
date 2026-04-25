"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, MapPin, Eye, Trash2 } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Pagination,
  Table,
  THead,
  TH,
  TR,
  TD,
  ConfirmDialog,
} from "@/components/ui";
import { deleteCustomerAction } from "@/lib/actions/customers";

type CustomerRow = {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  repName: string | null;
};

export function CustomerList({
  customers,
  isAdmin,
}: {
  customers: CustomerRow[];
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const PER_PAGE = 20;

  const q = search.toLowerCase();
  const allFiltered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.tradeName?.toLowerCase().includes(q) ?? false) ||
      (c.document?.includes(q) ?? false) ||
      (c.city?.toLowerCase().includes(q) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
  );
  const filtered = allFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const fd = new FormData();
    fd.set("id", deleteId);
    await deleteCustomerAction(fd);
    toast.success("Cliente excluido com sucesso");
    setDeleteId(null);
    setDeleting(false);
  }

  return (
    <>
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Buscar por nome, CNPJ, cidade, e-mail..."
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "Nenhum resultado" : "Nenhum cliente cadastrado"}
          hint={search ? `Nenhum cliente encontrado para "${search}"` : "Cadastre o primeiro cliente."}
          icon={Building2}
          action={
            !search ? (
              <Link href="/clientes/novo">
                <Button size="sm">Cadastrar cliente</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Cliente</TH>
              <TH>CNPJ</TH>
              {isAdmin && <TH>Representante</TH>}
              <TH>Local</TH>
              <TH>Contato</TH>
              <TH className="text-right">Acoes</TH>
            </tr>
          </THead>
          <tbody>
            {filtered.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link href={`/clientes/${c.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <Avatar name={c.name} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.name}</div>
                      {c.tradeName && (
                        <div className="truncate text-xs text-[var(--color-text-muted)]">{c.tradeName}</div>
                      )}
                    </div>
                  </Link>
                </TD>
                <TD className="font-mono text-xs text-[var(--color-text-muted)]">{c.document ?? "-"}</TD>
                {isAdmin && (
                  <TD>
                    {c.repName ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={c.repName} size="sm" />
                        <span className="text-sm">{c.repName}</span>
                      </div>
                    ) : (
                      <Badge tone="default">sem dono</Badge>
                    )}
                  </TD>
                )}
                <TD>
                  {c.city ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-[var(--color-text-dim)]" />
                      <span>{c.city}{c.state ? ` / ${c.state}` : ""}</span>
                    </div>
                  ) : (
                    <span className="text-[var(--color-text-dim)]">-</span>
                  )}
                </TD>
                <TD>
                  <div className="text-sm">{c.email ?? "-"}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{c.phone ?? ""}</div>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/clientes/${c.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <Pagination total={allFiltered.length} page={page} perPage={PER_PAGE} onChange={(p) => setPage(p)} />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir cliente?"
        description="Esta acao nao pode ser desfeita. Todas as vendas e propostas vinculadas serao afetadas."
        confirmLabel="Excluir"
        danger
        loading={deleting}
      />
    </>
  );
}
