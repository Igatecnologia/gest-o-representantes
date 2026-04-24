import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { brl, dateLong, maskCep, maskCnpj, maskPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isAdmin, repId } = await requireScope();

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id))
    .limit(1);

  if (!customer) notFound();

  // Rep só vê clientes próprios
  if (!isAdmin && customer.representativeId !== repId) {
    redirect("/clientes");
  }

  const sales = await db
    .select({
      id: schema.sales.id,
      total: schema.sales.total,
      quantity: schema.sales.quantity,
      status: schema.sales.status,
      createdAt: schema.sales.createdAt,
      repName: schema.representatives.name,
      productName: schema.products.name,
    })
    .from(schema.sales)
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.sales.representativeId)
    )
    .leftJoin(schema.products, eq(schema.products.id, schema.sales.productId))
    .where(eq(schema.sales.customerId, id))
    .orderBy(desc(schema.sales.createdAt));

  const totalSpent = sales
    .filter((s) => s.status === "approved")
    .reduce((acc, s) => acc + s.total, 0);

  const addressLine = [
    customer.street,
    customer.number,
    customer.complement,
  ]
    .filter(Boolean)
    .join(", ");

  const cityLine = [customer.district, customer.city, customer.state]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* Back link */}
      <Link
        href="/clientes"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para clientes
      </Link>

      {/* Header */}
      <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={customer.name} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
              {customer.tradeName && customer.tradeName !== customer.name && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {customer.tradeName}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {customer.document && (
                  <Badge tone="default" className="font-mono">
                    {maskCnpj(customer.document)}
                  </Badge>
                )}
                <Badge tone="brand">
                  <Building2 className="h-3 w-3" />
                  Cliente
                </Badge>
                {customer.source && customer.source !== "web" && (
                  <Badge tone="info">{customer.source}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/clientes/${customer.id}/editar`}>
              <Button variant="secondary">
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            </Link>
            <Link href={`/vendas/nova?customerId=${customer.id}`}>
              <Button>
                <Receipt className="h-3.5 w-3.5" />
                Nova venda
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MiniStat
          label="Total comprado"
          value={brl(totalSpent)}
          icon={Receipt}
        />
        <MiniStat
          label="Vendas registradas"
          value={String(sales.length)}
          icon={Building2}
        />
        <MiniStat
          label="Cliente desde"
          value={dateLong(customer.createdAt)}
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna esquerda: dados */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="mb-4 text-sm font-semibold">Contato</h2>
            <dl className="space-y-3">
              <DetailRow
                icon={Mail}
                label="E-mail"
                value={customer.email}
                isEmail
              />
              <DetailRow
                icon={Phone}
                label="Telefone"
                value={customer.phone ? maskPhone(customer.phone) : null}
              />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
              Endereço
            </h2>
            {customer.cep || addressLine ? (
              <div className="space-y-1.5 text-sm">
                {addressLine && <div>{addressLine}</div>}
                {cityLine && (
                  <div className="text-[var(--color-text-muted)]">{cityLine}</div>
                )}
                {customer.cep && (
                  <div className="font-mono text-xs text-[var(--color-text-muted)]">
                    CEP {maskCep(customer.cep)}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-dim)]">
                Endereço não cadastrado
              </p>
            )}
          </Card>

          {customer.notes && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold">Observações</h2>
              <p className="whitespace-pre-wrap text-sm text-[var(--color-text-muted)]">
                {customer.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Coluna direita: histórico de vendas */}
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-[var(--color-primary)]" />
                Histórico de vendas
              </h2>
              <span className="text-xs text-[var(--color-text-muted)]">
                {sales.length} registro(s)
              </span>
            </div>

            {sales.length === 0 ? (
              <EmptyState
                title="Nenhuma venda para este cliente"
                hint="Registre a primeira venda pelo botão acima."
                icon={Receipt}
              />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Data</TH>
                    <TH>Representante</TH>
                    <TH>Produto</TH>
                    <TH>Qtd</TH>
                    <TH className="text-right">Total</TH>
                    <TH>Status</TH>
                  </tr>
                </THead>
                <tbody>
                  {sales.map((s) => (
                    <TR key={s.id}>
                      <TD className="text-[var(--color-text-muted)]">
                        {dateLong(s.createdAt)}
                      </TD>
                      <TD>{s.repName ?? "-"}</TD>
                      <TD className="text-[var(--color-text-muted)]">
                        {s.productName ?? "-"}
                      </TD>
                      <TD className="tabular-nums">{s.quantity}</TD>
                      <TD className="text-right font-semibold tabular-nums">
                        {brl(s.total)}
                      </TD>
                      <TD>
                        {s.status === "approved" && (
                          <Badge tone="success">Aprovada</Badge>
                        )}
                        {s.status === "pending" && (
                          <Badge tone="warning">Pendente</Badge>
                        )}
                        {s.status === "cancelled" && (
                          <Badge tone="danger">Cancelada</Badge>
                        )}
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-brand-subtle border border-[var(--color-border)]">
        <Icon className="h-4 w-4 text-[var(--color-primary)]" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </div>
        <div className="text-lg font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  isEmail = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  isEmail?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
          {label}
        </div>
        {value ? (
          isEmail ? (
            <a
              href={`mailto:${value}`}
              className="block truncate text-sm hover:text-[var(--color-primary)]"
            >
              {value}
            </a>
          ) : (
            <div className="text-sm">{value}</div>
          )
        ) : (
          <div className="text-sm text-[var(--color-text-dim)]">-</div>
        )}
      </div>
    </div>
  );
}
