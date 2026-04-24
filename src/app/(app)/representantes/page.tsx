import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Users, Plus, Trash2, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  PageHeader,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { deleteRepAction } from "@/lib/actions/representatives";

export const dynamic = "force-dynamic";

export default async function RepsPage() {
  await requireAdmin();
  const reps = await db
    .select()
    .from(schema.representatives)
    .orderBy(desc(schema.representatives.createdAt));

  return (
    <>
      <PageHeader
        title="Representantes"
        description={`${reps.length} representante(s) na equipe`}
        icon={Users}
        actions={
          <Link href="/representantes/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo representante
            </Button>
          </Link>
        }
      />

      {reps.length === 0 ? (
        <EmptyState
          title="Nenhum representante cadastrado"
          hint="Adicione o primeiro representante com o percentual de comissão."
          icon={Users}
          action={
            <Link href="/representantes/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Cadastrar representante
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Nome</TH>
              <TH>Contato</TH>
              <TH>Comissão</TH>
              <TH>Status</TH>
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <tbody>
            {reps.map((r) => (
              <TR key={r.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} size="sm" />
                    <span className="font-medium">{r.name}</span>
                  </div>
                </TD>
                <TD>
                  <div className="text-sm">{r.email ?? "-"}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {r.phone ?? ""}
                  </div>
                </TD>
                <TD className="font-semibold tabular-nums">
                  {r.commissionPct.toFixed(2)}%
                </TD>
                <TD>
                  {r.active ? (
                    <Badge tone="success">Ativo</Badge>
                  ) : (
                    <Badge tone="danger">Inativo</Badge>
                  )}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/representantes/${r.id}/editar`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <form action={deleteRepAction} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <Button variant="ghost" size="sm" type="submit">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
