import { PageHeader } from "@/components/ui";
import { Users } from "lucide-react";
import { RepForm } from "../rep-form";
import { createRepAction } from "@/lib/actions/representatives";
import { requireAdmin } from "@/lib/auth";

export default async function NewRepPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Novo representante" icon={Users} />
      <RepForm action={createRepAction} submitLabel="Cadastrar" showLoginSection />
    </>
  );
}
