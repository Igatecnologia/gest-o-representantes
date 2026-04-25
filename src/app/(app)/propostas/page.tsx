import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
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
import { FileText, Plus } from "lucide-react";
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

  // Buscar totais dos itens por proposta
  const itemTotals = await db
    .select({
      proposalId: schema.proposalItems.proposalId,
      total: schema.proposalItems.value,
      type: schema.proposalItems.type,
    })
    .from(schema.proposalItems);

  const totalsMap = new Map<string, { oneTime: number; monthly: number }>();
  for (const item of itemTotals) {
    const cur = totalsMap.get(item.proposalId) ?? { oneTime: 0, monthly: 0 };
    if (item.type === "monthly") {
      cur.monthly += item.total;
    } else {
      cur.oneTime += item.total;
    }
    totalsMap.set(item.proposalId, cur);
  }

  return (
    <>
      <PageHeader
        title="Propostas"
        description="Propostas comerciais enviadas aos clientes"
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
        <Card>
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
      )}
    </>
  );
}
