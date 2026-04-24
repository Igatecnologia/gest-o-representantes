import Link from "next/link";
import { db, schema } from "@/lib/db";
import { and, desc, eq } from "drizzle-orm";
import { Receipt, Plus, X } from "lucide-react";
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
import { brl, dateShort } from "@/lib/utils";
import { cancelSaleAction } from "@/lib/actions/sales";
import { requireScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const { isAdmin, repId } = await requireScope();

  const where = isAdmin ? undefined : eq(schema.sales.representativeId, repId);

  const sales = await db
    .select({
      id: schema.sales.id,
      createdAt: schema.sales.createdAt,
      total: schema.sales.total,
      quantity: schema.sales.quantity,
      status: schema.sales.status,
      repName: schema.representatives.name,
      customerName: schema.customers.name,
      productName: schema.products.name,
    })
    .from(schema.sales)
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.sales.representativeId)
    )
    .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
    .leftJoin(schema.products, eq(schema.products.id, schema.sales.productId))
    .where(where)
    .orderBy(desc(schema.sales.createdAt));

  return (
    <>
      <PageHeader
        title={isAdmin ? "Vendas" : "Minhas vendas"}
        description={`${sales.length} venda(s) registrada(s)`}
        icon={Receipt}
        actions={
          <Link href="/vendas/nova">
            <Button>
              <Plus className="h-4 w-4" />
              Nova venda
            </Button>
          </Link>
        }
      />

      {sales.length === 0 ? (
        <EmptyState
          title="Nenhuma venda registrada"
          hint="Cadastre representante, cliente e produto antes de registrar vendas."
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
                    <form action={cancelSaleAction} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <Button variant="ghost" size="sm" type="submit">
                        <X className="h-3.5 w-3.5" />
                        Cancelar
                      </Button>
                    </form>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
