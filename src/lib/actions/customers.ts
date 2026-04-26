"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, eq, count } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { audit } from "@/lib/audit";

const customerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  tradeName: z.string().optional(),
  document: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  representativeId: z.string().optional(),
});

export async function createCustomerAction(_prev: unknown, formData: FormData) {
  const { repId, isAdmin } = await requireScope();
  const raw = Object.fromEntries(formData.entries());

  const parsed = customerSchema.safeParse({
    name: raw.name,
    tradeName: raw.tradeName ?? "",
    document: raw.document ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    cep: raw.cep ?? "",
    street: raw.street ?? "",
    number: raw.number ?? "",
    complement: raw.complement ?? "",
    district: raw.district ?? "",
    city: raw.city ?? "",
    state: raw.state ?? "",
    notes: raw.notes ?? "",
    representativeId: raw.representativeId ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;

  // Rep sempre cadastra em nome próprio; admin pode atribuir (ou deixar vazio)
  const ownerRepId = isAdmin ? d.representativeId || null : repId;

  const [customer] = await db.insert(schema.customers).values({
    representativeId: ownerRepId,
    name: d.name,
    tradeName: d.tradeName || null,
    document: d.document || null,
    email: d.email || null,
    phone: d.phone || null,
    cep: d.cep || null,
    street: d.street || null,
    number: d.number || null,
    complement: d.complement || null,
    district: d.district || null,
    city: d.city || null,
    state: d.state || null,
    notes: d.notes || null,
    source: "web",
  }).returning();

  // Cria deal automático no pipeline como "lead"
  if (ownerRepId) {
    await db.insert(schema.deals).values({
      title: `Lead — ${d.name}`,
      customerId: customer.id,
      representativeId: ownerRepId,
      value: 0,
      stage: "lead",
      probability: 10,
    });
    revalidatePath("/pipeline");
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateCustomerAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const { repId, isAdmin } = await requireScope();

  // Rep só edita clientes que são dele
  if (!isAdmin) {
    const [existing] = await db
      .select({ representativeId: schema.customers.representativeId })
      .from(schema.customers)
      .where(eq(schema.customers.id, id))
      .limit(1);
    if (!existing || existing.representativeId !== repId) {
      return { error: "Você não tem permissão para editar este cliente." };
    }
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse({
    name: raw.name,
    tradeName: raw.tradeName ?? "",
    document: raw.document ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    cep: raw.cep ?? "",
    street: raw.street ?? "",
    number: raw.number ?? "",
    complement: raw.complement ?? "",
    district: raw.district ?? "",
    city: raw.city ?? "",
    state: raw.state ?? "",
    notes: raw.notes ?? "",
    representativeId: raw.representativeId ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;
  const updateSet: Record<string, unknown> = {
    name: d.name,
    tradeName: d.tradeName || null,
    document: d.document || null,
    email: d.email || null,
    phone: d.phone || null,
    cep: d.cep || null,
    street: d.street || null,
    number: d.number || null,
    complement: d.complement || null,
    district: d.district || null,
    city: d.city || null,
    state: d.state || null,
    notes: d.notes || null,
  };
  // Só admin pode reatribuir dono
  if (isAdmin) {
    updateSet.representativeId = d.representativeId || null;
  }

  await db.update(schema.customers).set(updateSet).where(eq(schema.customers.id, id));

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function deleteCustomerAction(formData: FormData) {
  const { session, repId, isAdmin } = await requireScope();
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "ID inválido." };

  // Verificar dependências antes de deletar
  const [[salesCount], [proposalsCount], [dealsCount]] = await Promise.all([
    db.select({ total: count() }).from(schema.sales).where(eq(schema.sales.customerId, id)),
    db.select({ total: count() }).from(schema.proposals).where(eq(schema.proposals.customerId, id)),
    db.select({ total: count() }).from(schema.deals).where(eq(schema.deals.customerId, id)),
  ]);

  const deps: string[] = [];
  if (salesCount.total > 0) deps.push(`${salesCount.total} venda(s)`);
  if (proposalsCount.total > 0) deps.push(`${proposalsCount.total} proposta(s)`);
  if (dealsCount.total > 0) deps.push(`${dealsCount.total} negócio(s)`);

  if (deps.length > 0) {
    return { error: `Não é possível excluir: cliente possui ${deps.join(", ")}.` };
  }

  if (!isAdmin) {
    const result = await db
      .delete(schema.customers)
      .where(
        and(
          eq(schema.customers.id, id),
          eq(schema.customers.representativeId, repId)
        )
      );
    if (result.rowsAffected === 0) {
      return { error: "Você não tem permissão para excluir este cliente." };
    }
  } else {
    await db.delete(schema.customers).where(eq(schema.customers.id, id));
  }

  await audit(session, "delete", "customer", id);
  revalidatePath("/clientes");
}
