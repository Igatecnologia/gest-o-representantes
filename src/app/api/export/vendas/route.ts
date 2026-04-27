import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { brl, dateShort, csvSafe } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { isAdmin, repId, session } = await requireScope();

  const { blocked } = await checkRateLimit(`export-vendas:${session.sub}`, {
    maxAttempts: 10,
    windowMs: 60_000,
  });
  if (blocked) {
    return new Response("Muitas requisições. Aguarde.", { status: 429 });
  }

  // Mesmos filtros da página /vendas — assim CSV reflete o que está visível
  const url = new URL(request.url);
  const search = (url.searchParams.get("q") ?? "").trim();
  const statusFilter = url.searchParams.get("status") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";

  const scopeWhere = isAdmin ? undefined : eq(schema.sales.representativeId, repId!);
  const statusWhere = statusFilter ? eq(schema.sales.status, statusFilter) : undefined;

  const fromDate = from ? new Date(from + "T00:00:00") : null;
  const toDate = to ? new Date(to + "T23:59:59.999") : null;
  const dateWhere = fromDate || toDate
    ? sql.join(
        [
          ...(fromDate ? [sql`${schema.sales.createdAt} >= ${fromDate.getTime()}`] : []),
          ...(toDate ? [sql`${schema.sales.createdAt} <= ${toDate.getTime()}`] : []),
        ],
        sql` AND `,
      )
    : undefined;

  const searchWhere = search
    ? or(
        like(schema.customers.name, `%${search}%`),
        like(schema.products.name, `%${search}%`),
        like(schema.representatives.name, `%${search}%`),
      )
    : undefined;

  const conditions = [scopeWhere, statusWhere, dateWhere, searchWhere].filter(Boolean);
  const whereClause = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

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
    .where(whereClause)
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
    ].join(";"),
  );

  const csv = "﻿" + [header, ...rows].join("\n");

  // Sufixo no filename indicando se é filtrado
  const suffix = (from || to || statusFilter || search) ? "-filtrado" : "";
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas-${today}${suffix}.csv"`,
    },
  });
}
