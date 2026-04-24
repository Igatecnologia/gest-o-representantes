import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { Package } from "lucide-react";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ProductForm } from "../../product-form";
import { updateProductAction } from "@/lib/actions/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);

  if (!product) notFound();

  const boundAction = updateProductAction.bind(null, id);

  return (
    <>
      <PageHeader
        title="Editar produto"
        description={product.name}
        icon={Package}
      />
      <ProductForm
        action={boundAction}
        initial={product}
        submitLabel="Salvar alterações"
      />
    </>
  );
}
