import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ConfigTabs } from "./tabs";

export default async function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const isAdmin = session.role === "admin" || session.role === "manager";

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Gerencie sua conta e acessos do sistema"
        icon={Settings}
      />
      <ConfigTabs isAdmin={isAdmin} />
      {children}
    </>
  );
}
