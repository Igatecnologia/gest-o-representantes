"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireScope } from "@/lib/auth";

const fieldCustomerSchema = z.object({
  name: z.string().min(2),
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
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export async function createFieldCustomerAction(
  _prev: unknown,
  formData: FormData
) {
  const { repId } = await requireScope();
  const raw = Object.fromEntries(formData.entries());
  const parsed = fieldCustomerSchema.safeParse({
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
    latitude: raw.latitude || undefined,
    longitude: raw.longitude || undefined,
    notes: raw.notes ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;

  const [customer] = await db.insert(schema.customers).values({
    name: d.name,
    representativeId: repId,
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
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    notes: d.notes || null,
    source: "mobile_field",
  }).returning();

  // Cria deal automático no pipeline como "lead"
  if (repId) {
    await db.insert(schema.deals).values({
      title: `Lead — ${d.name}`,
      customerId: customer.id,
      representativeId: repId,
      value: 0,
      stage: "lead",
      probability: 10,
    });
  }

  revalidatePath("/clientes");
  revalidatePath("/pipeline");
  return { ok: true };
}
