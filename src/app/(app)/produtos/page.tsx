import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Package, Plus, Trash2, Pencil } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { deleteProductAction } from "@/lib/actions/products";
import { brl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  perpetual: "Perpétua",
  subscription_monthly: "Assinatura mensal",
  subscription_yearly: "Assinatura anual",
};

const TYPE_TONE: Record<string, "default" | "brand" | "info"> = {
  perpetual: "default",
  subscription_monthly: "brand",
  subscription_yearly: "info",
};

export default async function ProductsPage() {
  const products = await db
    .select()
    .from(schema.products)
    .orderBy(desc(schema.products.createdAt));

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`${products.length} produto(s) no catálogo`}
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

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado"
          hint="Adicione os produtos que seus representantes vendem."
          icon={Package}
          action={
            <Link href="/produtos/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Cadastrar produto
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Produto</TH>
              <TH>SKU</TH>
              <TH>Tipo</TH>
              <TH className="text-right">Preço</TH>
              <TH>Status</TH>
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <tbody>
            {products.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">{p.name}</TD>
                <TD className="font-mono text-xs text-[var(--color-text-muted)]">
                  {p.sku ?? "-"}
                </TD>
                <TD>
                  <Badge tone={TYPE_TONE[p.type]}>
                    {TYPE_LABEL[p.type] ?? p.type}
                  </Badge>
                </TD>
                <TD className="text-right font-semibold tabular-nums">{brl(p.price)}</TD>
                <TD>
                  {p.active ? (
                    <Badge tone="success">Ativo</Badge>
                  ) : (
                    <Badge tone="danger">Inativo</Badge>
                  )}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/produtos/${p.id}/editar`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <form action={deleteProductAction} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <Button variant="ghost" size="sm" type="submit">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
