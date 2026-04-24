import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { Wallet } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { brl, dateShort } from "@/lib/utils";
import {
  markCommissionPaidAction,
  revertCommissionAction,
} from "@/lib/actions/commissions";
import { requireScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
  const { isAdmin, repId } = await requireScope();

  const whereRows = isAdmin
    ? undefined
    : eq(schema.commissions.representativeId, repId);

  const rows = await db
    .select({
      id: schema.commissions.id,
      amount: schema.commissions.amount,
      status: schema.commissions.status,
      paidAt: schema.commissions.paidAt,
      createdAt: schema.commissions.createdAt,
      saleId: schema.commissions.saleId,
      saleTotal: schema.sales.total,
      saleStatus: schema.sales.status,
      repName: schema.representatives.name,
      customerName: schema.customers.name,
    })
    .from(schema.commissions)
    .leftJoin(schema.sales, eq(schema.sales.id, schema.commissions.saleId))
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.commissions.representativeId)
    )
    .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
    .where(whereRows)
    .orderBy(desc(schema.commissions.createdAt));

  const summaryByRepQuery = db
    .select({
      repId: schema.representatives.id,
      repName: schema.representatives.name,
      pending: sql<number>`coalesce(sum(case when ${schema.commissions.status} = 'pending' then ${schema.commissions.amount} else 0 end), 0)`,
      paid: sql<number>`coalesce(sum(case when ${schema.commissions.status} = 'paid' then ${schema.commissions.amount} else 0 end), 0)`,
    })
    .from(schema.representatives)
    .leftJoin(
      schema.commissions,
      eq(schema.commissions.representativeId, schema.representatives.id)
    )
    .groupBy(schema.representatives.id);

  const summaryByRep = await (isAdmin
    ? summaryByRepQuery
    : summaryByRepQuery.having(eq(schema.representatives.id, repId)));

  return (
    <>
      <PageHeader
        title={isAdmin ? "Comissões" : "Minhas comissões"}
        description={
          isAdmin ? "Controle de comissão por venda" : "Acompanhe o que você tem a receber"
        }
        icon={Wallet}
      />

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold">
          {isAdmin ? "Resumo por representante" : "Seu resumo"}
        </h2>
        {summaryByRep.length === 0 ? (
          <EmptyState title="Sem dados" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {summaryByRep.map((r) => (
              <div
                key={r.repId}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 py-3"
              >
                <div className="text-sm font-medium">{r.repName}</div>
                <div className="mt-2 flex justify-between text-xs">
                  <div>
                    <div className="text-[var(--color-text-muted)]">Pendente</div>
                    <div className="mt-0.5 text-sm font-semibold text-amber-400 tabular-nums">
                      {brl(r.pending ?? 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--color-text-muted)]">Pago</div>
                    <div className="mt-0.5 text-sm font-semibold text-emerald-400 tabular-nums">
                      {brl(r.paid ?? 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="Nenhuma comissão gerada" icon={Wallet} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Data venda</TH>
              {isAdmin && <TH>Representante</TH>}
              <TH>Cliente</TH>
              <TH className="text-right">Venda</TH>
              <TH className="text-right">Comissão</TH>
              <TH>Status</TH>
              <TH>Pago em</TH>
              {isAdmin && <TH className="text-right">Ações</TH>}
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
                      <form action={markCommissionPaidAction} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <Button type="submit">Marcar paga</Button>
                      </form>
                    ) : (
                      <form action={revertCommissionAction} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <Button variant="ghost" type="submit">
                          Reverter
                        </Button>
                      </form>
                    )}
                  </TD>
                )}
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
