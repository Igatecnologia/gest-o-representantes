import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Building2, Plus } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { requireScope } from "@/lib/auth";
import { CustomerList } from "./client";

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
        description={`${customers.length} empresa(s) na base`}
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
      <CustomerList customers={customers} isAdmin={isAdmin} />
    </>
  );
}
