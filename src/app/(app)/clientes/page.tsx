import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Building2, MapPin, Plus, Trash2, Eye } from "lucide-react";
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
import { deleteCustomerAction } from "@/lib/actions/customers";
import { requireScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { isAdmin, repId } = await requireScope();

  const baseQuery = db
    .select({
      id: schema.customers.id,
      name: schema.customers.name,
      tradeName: schema.customers.tradeName,
      document: schema.customers.document,
      email: schema.customers.email,
      phone: schema.customers.phone,
      city: schema.customers.city,
      state: schema.customers.state,
      representativeId: schema.customers.representativeId,
      repName: schema.representatives.name,
    })
    .from(schema.customers)
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.customers.representativeId)
    );

  const customers = await (isAdmin
    ? baseQuery.orderBy(desc(schema.customers.createdAt))
    : baseQuery
        .where(eq(schema.customers.representativeId, repId))
        .orderBy(desc(schema.customers.createdAt)));

  return (
    <>
      <PageHeader
        title={isAdmin ? "Clientes" : "Meus clientes"}
        description={
          isAdmin
            ? `${customers.length} empresa(s) na base`
            : `${customers.length} cliente(s) vinculado(s) a você`
        }
        icon={Building2}
        actions={
          <Link href="/clientes/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </Link>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          title={
            isAdmin ? "Nenhum cliente cadastrado" : "Você ainda não tem clientes"
          }
          hint={
            isAdmin
              ? "Cadastre o primeiro cliente para começar a registrar vendas."
              : "Cadastre seu primeiro cliente pelo botão acima."
          }
          icon={Building2}
          action={
            <Link href="/clientes/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Cadastrar cliente
              </Button>
            </Link>
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
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <tbody>
            {customers.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link
                    href={`/clientes/${c.id}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <Avatar name={c.name} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.name}</div>
                      {c.tradeName && (
                        <div className="truncate text-xs text-[var(--color-text-muted)]">
                          {c.tradeName}
                        </div>
                      )}
                    </div>
                  </Link>
                </TD>
                <TD className="font-mono text-xs text-[var(--color-text-muted)]">
                  {c.document ?? "-"}
                </TD>
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
                      <span>
                        {c.city}
                        {c.state ? ` / ${c.state}` : ""}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[var(--color-text-dim)]">-</span>
                  )}
                </TD>
                <TD>
                  <div className="text-sm">{c.email ?? "-"}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {c.phone ?? ""}
                  </div>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/clientes/${c.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <form action={deleteCustomerAction} className="inline">
                      <input type="hidden" name="id" value={c.id} />
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
