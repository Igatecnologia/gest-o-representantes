import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { brl, dateShort, csvSafe } from "@/lib/utils";

export async function GET() {
  const { isAdmin, repId } = await requireScope();

  const where = isAdmin ? undefined : eq(schema.commissions.representativeId, repId!);

  const rows = await db
    .select({
      id: schema.commissions.id,
      amount: schema.commissions.amount,
      status: schema.commissions.status,
      paidAt: schema.commissions.paidAt,
      createdAt: schema.commissions.createdAt,
      saleTotal: schema.sales.total,
      repName: schema.representatives.name,
      customerName: schema.customers.name,
    })
    .from(schema.commissions)
    .leftJoin(schema.sales, eq(schema.sales.id, schema.commissions.saleId))
    .leftJoin(schema.representatives, eq(schema.representatives.id, schema.commissions.representativeId))
    .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
    .where(where)
    .orderBy(desc(schema.commissions.createdAt))
    .limit(10000);

  const header = "Data;Representante;Cliente;Valor Venda;Comissao;Status;Pago em";
  const csvRows = rows.map((c) =>
    [
      dateShort(c.createdAt),
      csvSafe(c.repName ?? ""),
      csvSafe(c.customerName ?? ""),
      brl(c.saleTotal ?? 0),
      brl(c.amount),
      c.status === "paid" ? "Paga" : "Pendente",
      dateShort(c.paidAt),
    ].join(";")
  );

  const csv = "\uFEFF" + [header, ...csvRows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comissoes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
