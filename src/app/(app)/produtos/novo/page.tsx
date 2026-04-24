import { PageHeader } from "@/components/ui";
import { Package } from "lucide-react";
import { ProductForm } from "../product-form";
import { createProductAction } from "@/lib/actions/products";

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Novo produto" icon={Package} />
      <ProductForm action={createProductAction} submitLabel="Cadastrar" />
    </>
  );
}
