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
import { updateProposalStatusAction, duplicateProposalAction } from "@/lib/actions/proposals";
import {
  FileText,
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Pencil,
  Copy,
} from "lucide-react";
import { PdfButton } from "./pdf-button";
import { MarkAsSentWithFollowUp } from "./schedule-followup";

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
      customerDocument: schema.customers.document,
      customerCity: schema.customers.city,
      customerState: schema.customers.state,
      repName: schema.representatives.name,
      repEmail: schema.representatives.email,
      repPhone: schema.representatives.phone,
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
          <div className="flex gap-2">
            {isDraft && (
              <Link href={`/propostas/${proposal.id}/editar`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
            <Link href="/propostas">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Itens */}
          <Card>
            <h2 className="mb-4 text-sm font-semibold">Itens da proposta</h2>

            {/* Mobile: cards empilhados */}
            <div className="space-y-3 md:hidden">
              {items.map((item) => {
                const diff = item.value !== item.defaultValue && item.defaultValue > 0;
                return (
                  <div key={item.id} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge tone={item.type === "monthly" ? "brand" : item.type === "yearly" ? "info" : "default"}>
                        {typeLabel(item.type)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {item.defaultValue > 0 ? `Padrão: ${brl(item.defaultValue)}` : ""}
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold tabular-nums ${diff ? "text-amber-400" : ""}`}>
                          {brl(item.value)}
                        </span>
                        {diff && (
                          <div className="text-[10px] text-[var(--color-text-muted)]">
                            {item.value > item.defaultValue ? "+" : ""}{brl(item.value - item.defaultValue)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block">
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
            </div>
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
                <MarkAsSentWithFollowUp
                  proposalId={proposal.id}
                  customerId={proposal.customerId}
                />
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
              {/* Duplicar */}
              <form action={duplicateProposalAction}>
                <input type="hidden" name="id" value={proposal.id} />
                <Button size="sm" variant="outline" className="w-full">
                  <Copy className="h-3.5 w-3.5" />
                  Duplicar proposta
                </Button>
              </form>
            </div>
          </Card>

          {/* Gerar PDF */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-[var(--color-primary)]" />
              Exportar
            </h2>
            <PdfButton
              proposal={{
                id: proposal.id,
                createdAt: dateShort(proposal.createdAt),
                validUntil: proposal.validUntil ? dateShort(proposal.validUntil) : undefined,
                notes: proposal.notes ?? undefined,
                customerName: proposal.customerName ?? "",
                customerEmail: proposal.customerEmail ?? undefined,
                customerPhone: proposal.customerPhone ?? undefined,
                customerDocument: proposal.customerDocument ?? undefined,
                customerAddress: [proposal.customerCity, proposal.customerState].filter(Boolean).join(" / ") || undefined,
                repName: proposal.repName ?? "",
                repEmail: proposal.repEmail ?? undefined,
                repPhone: proposal.repPhone ?? undefined,
                productName: proposal.productName ?? "",
              }}
              items={items.map((i) => ({
                label: i.label,
                type: i.type as "one_time" | "monthly" | "yearly",
                defaultValue: i.defaultValue,
                value: i.value,
              }))}
              totals={{
                oneTime: totalOneTime,
                monthly: totalMonthly,
                yearly: totalYearly,
              }}
            />
            <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
              PDF com logo oficial, dados do cliente e tabela de itens
            </p>
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
