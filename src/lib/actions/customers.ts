"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";

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

  await db.insert(schema.customers).values({
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
  });

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
  const { repId, isAdmin } = await requireScope();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  if (!isAdmin) {
    // Rep só apaga os próprios
    await db
      .delete(schema.customers)
      .where(
        and(
          eq(schema.customers.id, id),
          eq(schema.customers.representativeId, repId)
        )
      );
  } else {
    await db.delete(schema.customers).where(eq(schema.customers.id, id));
  }
  revalidatePath("/clientes");
}
