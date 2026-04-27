import { db, schema } from "@/lib/db";
import { desc, eq, or, like, sql } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { brl, dateShort, csvSafe } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { isAdmin, repId, session } = await requireScope();

  const { blocked } = await checkRateLimit(`export-comissoes:${session.sub}`, {
    maxAttempts: 10,
    windowMs: 60_000,
  });
  if (blocked) {
    return new Response("Muitas requisições. Aguarde.", { status: 429 });
  }

  const url = new URL(request.url);
  const search = (url.searchParams.get("q") ?? "").trim();
  const statusFilter = url.searchParams.get("status") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";

  const scopeWhere = isAdmin ? undefined : eq(schema.commissions.representativeId, repId!);
  const statusWhere = statusFilter ? eq(schema.commissions.status, statusFilter) : undefined;

  const fromDate = from ? new Date(from + "T00:00:00") : null;
  const toDate = to ? new Date(to + "T23:59:59.999") : null;
  const dateWhere = fromDate || toDate
    ? sql.join(
        [
          ...(fromDate ? [sql`${schema.commissions.createdAt} >= ${fromDate.getTime()}`] : []),
          ...(toDate ? [sql`${schema.commissions.createdAt} <= ${toDate.getTime()}`] : []),
        ],
        sql` AND `,
      )
    : undefined;

  const searchWhere = search
    ? or(
        like(schema.representatives.name, `%${search}%`),
        like(schema.customers.name, `%${search}%`),
      )
    : undefined;

  const conditions = [scopeWhere, statusWhere, dateWhere, searchWhere].filter(Boolean);
  const whereClause = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

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
    .where(whereClause)
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
    ].join(";"),
  );

  const csv = "﻿" + [header, ...csvRows].join("\n");

  const suffix = (from || to || statusFilter || search) ? "-filtrado" : "";
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comissoes-${today}${suffix}.csv"`,
    },
  });
}
