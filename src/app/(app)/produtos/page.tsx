import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Package, Plus } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { ProductList } from "./client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireAdmin();
  const products = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      sku: schema.products.sku,
      price: schema.products.price,
      type: schema.products.type,
      active: schema.products.active,
    })
    .from(schema.products)
    .orderBy(desc(schema.products.createdAt));

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
