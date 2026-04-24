import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { Users } from "lucide-react";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { RepForm } from "../../rep-form";
import { updateRepAction } from "@/lib/actions/representatives";
import { requireAdmin } from "@/lib/auth";

export default async function EditRepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [rep] = await db
    .select()
    .from(schema.representatives)
    .where(eq(schema.representatives.id, id))
    .limit(1);

  if (!rep) notFound();

  const boundAction = updateRepAction.bind(null, id);

  return (
    <>
      <PageHeader
        title="Editar representante"
        description={rep.name}
        icon={Users}
      />
      <RepForm action={boundAction} initial={rep} submitLabel="Salvar alterações" />
    </>
  );
}
