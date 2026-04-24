import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { Building2 } from "lucide-react";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { CustomerForm } from "../../customer-form";
import { updateCustomerAction } from "@/lib/actions/customers";
import { requireScope } from "@/lib/auth";

export default async function EditCustomerPage({
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
  if (!isAdmin && customer.representativeId !== repId) redirect("/clientes");

  const boundAction = updateCustomerAction.bind(null, id);

  return (
    <>
      <PageHeader
        title="Editar cliente"
        description={customer.name}
        icon={Building2}
      />
      <CustomerForm
        action={boundAction}
        initial={customer}
        submitLabel="Salvar alterações"
      />
    </>
  );
}
