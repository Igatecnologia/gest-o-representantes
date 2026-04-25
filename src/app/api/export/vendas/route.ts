import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { brl, dateShort, csvSafe } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const { isAdmin, repId, session } = await requireScope();

  const { blocked } = await checkRateLimit(`export-vendas:${session.sub}`, {
    maxAttempts: 10,
    windowMs: 60_000,
  });
  if (blocked) {
    return new Response("Muitas requisições. Aguarde.", { status: 429 });
  }

  const where = isAdmin ? undefined : eq(schema.sales.representativeId, repId!);

  const sales = await db
    .select({
      id: schema.sales.id,
      createdAt: schema.sales.createdAt,
      total: schema.sales.total,
      quantity: schema.sales.quantity,
      unitPrice: schema.sales.unitPrice,
      discount: schema.sales.discount,
      status: schema.sales.status,
      repName: schema.representatives.name,
      customerName: schema.customers.name,
      productName: schema.products.name,
    })
    .from(schema.sales)
    .leftJoin(schema.representatives, eq(schema.representatives.id, schema.sales.representativeId))
    .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
    .leftJoin(schema.products, eq(schema.products.id, schema.sales.productId))
    .where(where)
    .orderBy(desc(schema.sales.createdAt))
    .limit(10000);

  const header = "Data;Representante;Cliente;Produto;Qtd;Preco Unitario;Desconto;Total;Status";
  const rows = sales.map((s) =>
    [
      dateShort(s.createdAt),
      csvSafe(s.repName ?? ""),
      csvSafe(s.customerName ?? ""),
      csvSafe(s.productName ?? ""),
      s.quantity,
      brl(s.unitPrice),
      brl(s.discount),
      brl(s.total),
      s.status === "approved" ? "Aprovada" : s.status === "pending" ? "Pendente" : "Cancelada",
    ].join(";")
  );

  const csv = "\uFEFF" + [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
