import { PageHeader } from "@/components/ui";
import { Upload } from "lucide-react";
import { ImportForm } from "./form";

export const dynamic = "force-dynamic";

export default function ImportarClientesPage() {
  return (
    <>
      <PageHeader
        title="Importar clientes"
        description="Suba um CSV com clientes em massa"
        icon={Upload}
      />
      <ImportForm />
    </>
  );
}
