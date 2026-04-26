"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { toCents } from "@/lib/utils";
import { audit } from "@/lib/audit";

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  price: z.coerce.number().positive(),
  implementationPrice: z.coerce.number().nonnegative().default(0),
  type: z.enum(["perpetual", "subscription_monthly", "subscription_yearly"]),
  active: z.union([z.literal("on"), z.literal(null), z.literal("")]).optional(),
});

export async function createProductAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") ?? "",
    price: formData.get("price"),
    implementationPrice: formData.get("implementationPrice") ?? 0,
    type: formData.get("type"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.insert(schema.products).values({
    name: parsed.data.name,
    sku: parsed.data.sku || null,
    price: toCents(parsed.data.price),
    implementationPrice: toCents(parsed.data.implementationPrice),
    type: parsed.data.type,
    active: parsed.data.active === "on",
  });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function updateProductAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") ?? "",
    price: formData.get("price"),
    implementationPrice: formData.get("implementationPrice") ?? 0,
    type: formData.get("type"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db
    .update(schema.products)
    .set({
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      price: toCents(parsed.data.price),
      implementationPrice: toCents(parsed.data.implementationPrice),
      type: parsed.data.type,
      active: parsed.data.active === "on",
    })
    .where(eq(schema.products.id, id));

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function deleteProductAction(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "ID inválido." };

  // Verificar dependências antes de deletar
  const [[salesCount], [proposalsCount]] = await Promise.all([
    db.select({ total: count() }).from(schema.sales).where(eq(schema.sales.productId, id)),
    db.select({ total: count() }).from(schema.proposals).where(eq(schema.proposals.productId, id)),
  ]);

  const deps: string[] = [];
  if (salesCount.total > 0) deps.push(`${salesCount.total} venda(s)`);
  if (proposalsCount.total > 0) deps.push(`${proposalsCount.total} proposta(s)`);

  if (deps.length > 0) {
    return { error: `Não é possível excluir: produto possui ${deps.join(", ")}.` };
  }

  await db.delete(schema.products).where(eq(schema.products.id, id));
  await audit(session, "delete", "product", id);
  revalidatePath("/produtos");
}
