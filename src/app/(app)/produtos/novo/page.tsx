import { PageHeader } from "@/components/ui";
import { Package } from "lucide-react";
import { ProductForm } from "../product-form";
import { createProductAction } from "@/lib/actions/products";
import { requireAdmin } from "@/lib/auth";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Novo produto" icon={Package} />
      <ProductForm action={createProductAction} submitLabel="Cadastrar" />
    </>
  );
}
