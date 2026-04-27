import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getSession, getCurrentRep, isAdmin as checkAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;
  const admin = checkAdmin(session);
  const rep = !admin ? await getCurrentRep(session) : null;
  const repId = rep?.id;

  // Rep só vê seus próprios clientes e propostas
  const customerWhere = admin
    ? sql`${schema.customers.name} LIKE ${pattern}`
    : sql`${schema.customers.name} LIKE ${pattern} AND ${schema.customers.representativeId} = ${repId}`;

  const proposalWhere = admin
    ? sql`${schema.customers.name} LIKE ${pattern}`
    : sql`${schema.customers.name} LIKE ${pattern} AND ${schema.proposals.representativeId} = ${repId}`;

  const [customers, products, proposals] = await Promise.all([
    db
      .select({ id: schema.customers.id, name: schema.customers.name })
      .from(schema.customers)
      .where(customerWhere)
      .limit(5),
    db
      .select({ id: schema.products.id, name: schema.products.name })
      .from(schema.products)
      .where(sql`${schema.products.name} LIKE ${pattern}`)
      .limit(5),
    db
      .select({
        id: schema.proposals.id,
        customerName: schema.customers.name,
      })
      .from(schema.proposals)
      .leftJoin(schema.customers, sql`${schema.customers.id} = ${schema.proposals.customerId}`)
      .where(proposalWhere)
      .limit(5),
  ]);

  return NextResponse.json({
    results: [
      ...customers.map((c) => ({ type: "cliente", id: c.id, label: c.name, href: `/clientes/${c.id}` })),
      ...products.map((p) => ({ type: "produto", id: p.id, label: p.name, href: `/produtos/${p.id}/editar` })),
      ...proposals.map((p) => ({ type: "proposta", id: p.id, label: p.customerName ?? p.id, href: `/propostas/${p.id}` })),
    ],
  });
}
