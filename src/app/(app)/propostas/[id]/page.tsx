import { notFound } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { brl, dateShort } from "@/lib/utils";
import { PROPOSAL_STATUSES } from "@/lib/db/schema";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Table,
  THead,
  TH,
  TR,
  TD,
} from "@/components/ui";
import { updateProposalStatusAction } from "@/lib/actions/proposals";
import {
  FileText,
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "default" | "brand" | "success" | "warning" | "danger"> = {
  draft: "default",
  sent: "brand",
  accepted: "success",
  rejected: "danger",
  expired: "warning",
};

function typeLabel(type: string) {
  switch (type) {
    case "one_time": return "Único";
    case "monthly": return "Mensal";
    case "yearly": return "Anual";
    default: return type;
  }
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isAdmin, repId } = await requireScope();

  const [proposal] = await db
    .select({
      id: schema.proposals.id,
      status: schema.proposals.status,
      validUntil: schema.proposals.validUntil,
      notes: schema.proposals.notes,
      createdAt: schema.proposals.createdAt,
      customerId: schema.proposals.customerId,
      representativeId: schema.proposals.representativeId,
      customerName: schema.customers.name,
      customerEmail: schema.customers.email,
      customerPhone: schema.customers.phone,
      repName: schema.representatives.name,
      productName: schema.products.name,
    })
    .from(schema.proposals)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.proposals.customerId))
    .leftJoin(schema.representatives, eq(schema.representatives.id, schema.proposals.representativeId))
    .leftJoin(schema.products, eq(schema.products.id, schema.proposals.productId))
    .where(eq(schema.proposals.id, id))
    .limit(1);

  if (!proposal) notFound();
  if (!isAdmin && proposal.representativeId !== repId) notFound();

  const items = await db
    .select()
    .from(schema.proposalItems)
    .where(eq(schema.proposalItems.proposalId, id));

  const totalOneTime = items.filter((i) => i.type === "one_time").reduce((s, i) => s + i.value, 0);
  const totalMonthly = items.filter((i) => i.type === "monthly").reduce((s, i) => s + i.value, 0);
  const totalYearly = items.filter((i) => i.type === "yearly").reduce((s, i) => s + i.value, 0);

  const statusMeta = PROPOSAL_STATUSES.find((s) => s.id === proposal.status);
  const isDraft = proposal.status === "draft";
  const isSent = proposal.status === "sent";

  return (
    <>
      <PageHeader
        title={`Proposta — ${proposal.customerName}`}
        description={`Sistema: ${proposal.productName} · Criada em ${dateShort(proposal.createdAt)}`}
        icon={FileText}
        actions={
          <Link href="/propostas">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Itens */}
          <Card>
            <h2 className="mb-4 text-sm font-semibold">Itens da proposta</h2>
            <Table>
              <THead>
                <tr>
                  <TH>Item</TH>
                  <TH>Tipo</TH>
                  <TH className="text-right">Valor padrão</TH>
                  <TH className="text-right">Valor proposto</TH>
                </tr>
              </THead>
              <tbody>
                {items.map((item) => {
                  const diff = item.value !== item.defaultValue && item.defaultValue > 0;
                  return (
                    <TR key={item.id}>
                      <TD className="font-medium">{item.label}</TD>
                      <TD>
                        <Badge tone={item.type === "monthly" ? "brand" : item.type === "yearly" ? "info" : "default"}>
                          {typeLabel(item.type)}
                        </Badge>
                      </TD>
                      <TD className="text-right tabular-nums text-[var(--color-text-muted)]">
                        {item.defaultValue > 0 ? brl(item.defaultValue) : "—"}
                      </TD>
                      <TD className="text-right tabular-nums font-semibold">
                        <span className={diff ? "text-amber-400" : ""}>
                          {brl(item.value)}
                        </span>
                        {diff && (
                          <span className="ml-1.5 text-xs text-[var(--color-text-muted)]">
                            ({item.value > item.defaultValue ? "+" : ""}
                            {brl(item.value - item.defaultValue)})
                          </span>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </Card>

          {/* Notas */}
          {proposal.notes && (
            <Card>
              <h2 className="mb-2 text-sm font-semibold">Observações</h2>
              <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-wrap">
                {proposal.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Status</h2>
            <Badge tone={STATUS_TONE[proposal.status] ?? "default"} className="text-sm px-3 py-1">
              {statusMeta?.label ?? proposal.status}
            </Badge>

            {proposal.validUntil && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <Clock className="h-3.5 w-3.5" />
                Válida até {dateShort(proposal.validUntil)}
              </div>
            )}

            {/* Ações de status */}
            <div className="mt-4 space-y-2">
              {isDraft && (
                <form action={updateProposalStatusAction}>
                  <input type="hidden" name="id" value={proposal.id} />
                  <input type="hidden" name="status" value="sent" />
                  <Button size="sm" className="w-full">
                    <Send className="h-3.5 w-3.5" />
                    Marcar como enviada
                  </Button>
                </form>
              )}
              {isSent && (
                <div className="flex gap-2">
                  <form action={updateProposalStatusAction} className="flex-1">
                    <input type="hidden" name="id" value={proposal.id} />
                    <input type="hidden" name="status" value="accepted" />
                    <Button size="sm" className="w-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aceita
                    </Button>
                  </form>
                  <form action={updateProposalStatusAction} className="flex-1">
                    <input type="hidden" name="id" value={proposal.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <Button size="sm" variant="danger" className="w-full">
                      <XCircle className="h-3.5 w-3.5" />
                      Recusada
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </Card>

          {/* Resumo financeiro */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Resumo financeiro</h2>
            <dl className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2.5">
                <dt className="text-xs text-[var(--color-text-muted)]">Implantação / Únicos</dt>
                <dd className="text-sm font-semibold tabular-nums">{brl(totalOneTime)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2.5">
                <dt className="text-xs text-[var(--color-text-muted)]">Mensalidade</dt>
                <dd className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">{brl(totalMonthly)}</dd>
              </div>
              {totalYearly > 0 && (
                <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2.5">
                  <dt className="text-xs text-[var(--color-text-muted)]">Anual</dt>
                  <dd className="text-sm font-semibold tabular-nums">{brl(totalYearly)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Info do cliente */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Cliente</h2>
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">{proposal.customerName}</div>
              {proposal.customerEmail && (
                <div className="text-[var(--color-text-muted)]">{proposal.customerEmail}</div>
              )}
              {proposal.customerPhone && (
                <div className="text-[var(--color-text-muted)]">{proposal.customerPhone}</div>
              )}
            </div>
            <div className="mt-3 text-xs text-[var(--color-text-muted)]">
              Representante: {proposal.repName}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
