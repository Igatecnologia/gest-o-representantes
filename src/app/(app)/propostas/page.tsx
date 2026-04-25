import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { brl, dateShort } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Table,
  THead,
  TH,
  TR,
  TD,
} from "@/components/ui";
import { FileText, Plus, ChevronRight } from "lucide-react";
import { PROPOSAL_STATUSES } from "@/lib/db/schema";
import { deleteProposalAction } from "@/lib/actions/proposals";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "default" | "brand" | "success" | "warning" | "danger"> = {
  draft: "default",
  sent: "brand",
  accepted: "success",
  rejected: "danger",
  expired: "warning",
};

export default async function PropostasPage() {
  const { isAdmin, repId } = await requireScope();

  const where = isAdmin ? undefined : eq(schema.proposals.representativeId, repId!);

  const proposals = await db
    .select({
      id: schema.proposals.id,
      status: schema.proposals.status,
      validUntil: schema.proposals.validUntil,
      createdAt: schema.proposals.createdAt,
      customerName: schema.customers.name,
      repName: schema.representatives.name,
      productName: schema.products.name,
    })
    .from(schema.proposals)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.proposals.customerId))
    .leftJoin(schema.representatives, eq(schema.representatives.id, schema.proposals.representativeId))
    .leftJoin(schema.products, eq(schema.products.id, schema.proposals.productId))
    .where(where)
    .orderBy(desc(schema.proposals.createdAt));

  // Buscar totais com aggregation numa unica query
  const totalsMap = new Map<string, { oneTime: number; monthly: number }>();

  try {
    const itemAgg = await db
      .select({
        proposalId: schema.proposalItems.proposalId,
        type: schema.proposalItems.type,
        sum: sql<number>`coalesce(sum(${schema.proposalItems.value}), 0)`,
      })
      .from(schema.proposalItems)
      .groupBy(schema.proposalItems.proposalId, schema.proposalItems.type);

    for (const row of itemAgg) {
      const cur = totalsMap.get(row.proposalId) ?? { oneTime: 0, monthly: 0 };
      if (row.type === "monthly") {
        cur.monthly = row.sum;
      } else {
        cur.oneTime += row.sum;
      }
      totalsMap.set(row.proposalId, cur);
    }
  } catch (err) {
    console.error("[propostas] Erro ao buscar totais:", err);
  }

  return (
    <>
      <PageHeader
        title="Propostas"
        description="Propostas comerciais"
        icon={FileText}
        actions={
          <Link href="/propostas/nova">
            <Button>
              <Plus className="h-4 w-4" />
              Nova proposta
            </Button>
          </Link>
        }
      />

      {proposals.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma proposta ainda"
            hint="Crie uma proposta comercial para um cliente"
            icon={FileText}
            action={
              <Link href="/propostas/nova">
                <Button size="sm">Criar proposta</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {proposals.map((p) => {
              const totals = totalsMap.get(p.id) ?? { oneTime: 0, monthly: 0 };
              const statusMeta = PROPOSAL_STATUSES.find((s) => s.id === p.status);
              return (
                <Link key={p.id} href={`/propostas/${p.id}`}>
                  <Card className="active:scale-[0.98] transition-transform">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{p.customerName ?? "—"}</span>
                          <Badge tone={STATUS_TONE[p.status] ?? "default"} className="shrink-0">
                            {statusMeta?.label ?? p.status}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                          {p.productName ?? "—"}
                          {isAdmin && p.repName ? ` · ${p.repName}` : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-dim)] mt-1" />
                    </div>

                    <div className="mt-3 flex items-center gap-4 border-t border-[var(--color-border)] pt-3">
                      {totals.oneTime > 0 && (
                        <div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">Implantação</div>
                          <div className="text-sm font-semibold tabular-nums">{brl(totals.oneTime)}</div>
                        </div>
                      )}
                      {totals.monthly > 0 && (
                        <div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">Mensal</div>
                          <div className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">{brl(totals.monthly)}</div>
                        </div>
                      )}
                      <div className="ml-auto text-right">
                        <div className="text-[10px] text-[var(--color-text-muted)]">Criada em</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{dateShort(p.createdAt)}</div>
                      </div>
                    </div>

                    {p.status === "draft" && (
                      <div className="mt-2 flex justify-end" onClick={(e) => e.preventDefault()}>
                        <form action={deleteProposalAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-[11px] text-[var(--color-text-muted)] hover:text-red-400"
                          >
                            Excluir rascunho
                          </button>
                        </form>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <TH>Data</TH>
                  {isAdmin && <TH>Representante</TH>}
                  <TH>Cliente</TH>
                  <TH>Sistema</TH>
                  <TH>Implantação</TH>
                  <TH>Mensal</TH>
                  <TH>Validade</TH>
                  <TH>Status</TH>
                  <TH>{" "}</TH>
                </tr>
              </THead>
              <tbody>
                {proposals.map((p) => {
                  const totals = totalsMap.get(p.id) ?? { oneTime: 0, monthly: 0 };
                  const statusMeta = PROPOSAL_STATUSES.find((s) => s.id === p.status);
                  return (
                    <TR key={p.id}>
                      <TD className="text-[var(--color-text-muted)]">{dateShort(p.createdAt)}</TD>
                      {isAdmin && <TD>{p.repName ?? "—"}</TD>}
                      <TD className="font-medium">{p.customerName ?? "—"}</TD>
                      <TD>{p.productName ?? "—"}</TD>
                      <TD className="tabular-nums">{brl(totals.oneTime)}</TD>
                      <TD className="tabular-nums">{brl(totals.monthly)}</TD>
                      <TD className="text-[var(--color-text-muted)]">
                        {p.validUntil ? dateShort(p.validUntil) : "—"}
                      </TD>
                      <TD>
                        <Badge tone={STATUS_TONE[p.status] ?? "default"}>
                          {statusMeta?.label ?? p.status}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/propostas/${p.id}`}
                            className="text-xs text-[var(--color-primary)] hover:underline"
                          >
                            Ver
                          </Link>
                          {p.status === "draft" && (
                            <form action={deleteProposalAction}>
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                type="submit"
                                className="text-xs text-[var(--color-text-muted)] hover:text-red-400"
                              >
                                Excluir
                              </button>
                            </form>
                          )}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </>
  );
}
