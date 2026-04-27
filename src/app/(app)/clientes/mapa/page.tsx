import { db, schema } from "@/lib/db";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { MapPin } from "lucide-react";
import { CustomerMap } from "./client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomerMapPage() {
  const { isAdmin, repId } = await requireScope();

  const scopeWhere = isAdmin
    ? undefined
    : eq(schema.customers.representativeId, repId);

  // Apenas clientes com coordenadas
  const customers = await db
    .select({
      id: schema.customers.id,
      name: schema.customers.name,
      tradeName: schema.customers.tradeName,
      latitude: schema.customers.latitude,
      longitude: schema.customers.longitude,
      city: schema.customers.city,
      state: schema.customers.state,
      phone: schema.customers.phone,
      repName: schema.representatives.name,
    })
    .from(schema.customers)
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.customers.representativeId),
    )
    .where(
      and(
        isNotNull(schema.customers.latitude),
        isNotNull(schema.customers.longitude),
        scopeWhere,
      ),
    )
    .orderBy(desc(schema.customers.createdAt));

  // Conta clientes total (com e sem coord) pra mostrar quanto está mapeado
  const [totalCount] = await db
    .select({ count: schema.customers.id })
    .from(schema.customers)
    .where(scopeWhere)
    .limit(1);

  return (
    <>
      <PageHeader
        title="Mapa de clientes"
        description={`${customers.length} cliente(s) geolocalizado(s)`}
        icon={MapPin}
      />

      {customers.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-[var(--color-text-dim)]" />
          <h3 className="mb-1 text-sm font-semibold">
            Nenhum cliente geolocalizado
          </h3>
          <p className="mx-auto max-w-md text-xs text-[var(--color-text-muted)]">
            Os clientes aparecem aqui quando têm latitude/longitude
            cadastradas. Use a tela de{" "}
            <Link
              href="/campo"
              className="text-[var(--color-primary)] underline"
            >
              cadastro em campo
            </Link>{" "}
            (captura GPS automático) ou edite o cliente.
          </p>
        </div>
      ) : (
        <CustomerMap
          customers={customers.map((c) => ({
            ...c,
            latitude: c.latitude!,
            longitude: c.longitude!,
          }))}
        />
      )}
    </>
  );
}
