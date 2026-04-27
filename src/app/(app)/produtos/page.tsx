import Link from "next/link";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Package, Plus } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { ProductList } from "./client";

export const dynamic = "force-dynamic";

// Lista de produtos é admin-only e muda raramente — cache de 5min,
// invalidado por revalidateTag("products") nas mutations.
const getProductsCached = unstable_cache(
  async () =>
    db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        sku: schema.products.sku,
        price: schema.products.price,
        implementationPrice: schema.products.implementationPrice,
        type: schema.products.type,
        active: schema.products.active,
      })
      .from(schema.products)
      .orderBy(desc(schema.products.createdAt)),
  ["products-list-v2"],
  { revalidate: 300, tags: ["products"] },
);

export default async function ProductsPage() {
  await requireAdmin();
  const products = await getProductsCached();

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`${products.length} produto(s) no catalogo`}
        icon={Package}
        actions={
          <Link href="/produtos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo produto
            </Button>
          </Link>
        }
      />
      <ProductList products={products} />
    </>
  );
}
