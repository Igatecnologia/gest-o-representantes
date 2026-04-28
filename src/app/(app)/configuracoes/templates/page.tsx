import { PageHeader } from "@/components/ui";
import { MessageSquareText } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAllTemplates } from "@/lib/actions/templates";
import { TemplatesManager } from "./client";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requireAdmin();
  const templates = await getAllTemplates();

  return (
    <>
      <PageHeader
        title="Templates de mensagem"
        description="Modelos prontos pra WhatsApp, propostas e retornos"
        icon={MessageSquareText}
      />
      <TemplatesManager templates={templates} />
    </>
  );
}
