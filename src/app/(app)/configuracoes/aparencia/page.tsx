import { PageHeader } from "@/components/ui";
import { Palette } from "lucide-react";
import { AppearanceForm } from "./form";

export const dynamic = "force-dynamic";

export default function AparenciaPage() {
  return (
    <>
      <PageHeader
        title="Aparência"
        description="Personalize como a interface se comporta no seu navegador"
        icon={Palette}
      />
      <AppearanceForm />
    </>
  );
}
