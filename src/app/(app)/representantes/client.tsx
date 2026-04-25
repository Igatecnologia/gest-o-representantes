"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Pencil, Trash2 } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Table,
  THead,
  TH,
  TR,
  TD,
  ConfirmDialog,
} from "@/components/ui";
import { deleteRepAction } from "@/lib/actions/representatives";

type RepRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  commissionPct: number;
  active: boolean;
};

export function RepList({ reps }: { reps: RepRow[] }) {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const q = search.toLowerCase();
  const filtered = reps.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      (r.email?.toLowerCase().includes(q) ?? false) ||
      (r.phone?.includes(q) ?? false)
  );

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const fd = new FormData();
    fd.set("id", deleteId);
    await deleteRepAction(fd);
    toast.success("Representante excluido");
    setDeleteId(null);
    setDeleting(false);
  }

  return (
    <>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, e-mail, telefone..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "Nenhum resultado" : "Nenhum representante cadastrado"}
          hint={search ? "Ajuste a busca." : "Adicione o primeiro representante."}
          icon={Users}
          action={!search ? <Link href="/representantes/novo"><Button size="sm">Cadastrar</Button></Link> : undefined}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Nome</TH>
              <TH>Contato</TH>
              <TH>Comissao</TH>
              <TH>Status</TH>
              <TH className="text-right">Acoes</TH>
            </tr>
          </THead>
          <tbody>
            {filtered.map((r) => (
              <TR key={r.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} size="sm" />
                    <span className="font-medium">{r.name}</span>
                  </div>
                </TD>
                <TD>
                  <div className="text-sm">{r.email ?? "-"}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{r.phone ?? ""}</div>
                </TD>
                <TD className="font-semibold tabular-nums">{r.commissionPct.toFixed(2)}%</TD>
                <TD>
                  {r.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="danger">Inativo</Badge>}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/representantes/${r.id}/editar`}>
                      <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)}>
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
        title="Excluir representante?"
        description="Vendas e comissoes vinculadas serao afetadas."
        confirmLabel="Excluir"
        danger
        loading={deleting}
      />
    </>
  );
}
