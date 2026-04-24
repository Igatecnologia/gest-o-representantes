import { PageHeader } from "@/components/ui";
import { Building2 } from "lucide-react";
import { CustomerForm } from "../customer-form";
import { createCustomerAction } from "@/lib/actions/customers";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader
        title="Novo cliente"
        description="Digite o CNPJ e o CEP — os demais campos são preenchidos automaticamente"
        icon={Building2}
      />
      <CustomerForm action={createCustomerAction} submitLabel="Cadastrar cliente" />
    </>
  );
}
