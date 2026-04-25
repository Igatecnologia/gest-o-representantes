import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { Wallet, Download } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { brl } from "@/lib/utils";
import { requireScope } from "@/lib/auth";
import { CommissionList } from "./client";

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
      saleTotal: schema.sales.total,
      repName: schema.representatives.name,
      customerName: schema.customers.name,
    })
    .from(schema.commissions)
    .leftJoin(schema.sales, eq(schema.sales.id, schema.commissions.saleId))
    .leftJoin(schema.representatives, eq(schema.representatives.id, schema.commissions.representativeId))
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
    .leftJoin(schema.commissions, eq(schema.commissions.representativeId, schema.representatives.id))
    .groupBy(schema.representatives.id);

  const summaryByRep = await (isAdmin
    ? summaryByRepQuery
    : summaryByRepQuery.having(eq(schema.representatives.id, repId)));

  return (
    <>
      <PageHeader
        title={isAdmin ? "Comissoes" : "Minhas comissoes"}
        description={isAdmin ? "Controle de comissao por venda" : "Acompanhe o que voce tem a receber"}
        icon={Wallet}
        actions={
          rows.length > 0 ? (
            <a href="/api/export/comissoes">
              <Button variant="secondary">
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </a>
          ) : undefined
        }
      />

      {summaryByRep.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-4 text-sm font-semibold">
            {isAdmin ? "Resumo por representante" : "Seu resumo"}
          </h2>
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
        </Card>
      )}

      <CommissionList rows={rows} isAdmin={isAdmin} />
    </>
  );
}
