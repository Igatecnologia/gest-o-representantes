"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  price: z.coerce.number().positive(),
  type: z.enum(["perpetual", "subscription_monthly", "subscription_yearly"]),
  active: z.union([z.literal("on"), z.literal(null), z.literal("")]).optional(),
});

export async function createProductAction(_prev: unknown, formData: FormData) {
  await requireUser();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") ?? "",
    price: formData.get("price"),
    type: formData.get("type"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.insert(schema.products).values({
    name: parsed.data.name,
    sku: parsed.data.sku || null,
    price: parsed.data.price,
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
  await requireUser();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") ?? "",
    price: formData.get("price"),
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
      price: parsed.data.price,
      type: parsed.data.type,
      active: parsed.data.active === "on",
    })
    .where(eq(schema.products.id, id));

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function deleteProductAction(formData: FormData) {
  await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await db.delete(schema.products).where(eq(schema.products.id, id));
  revalidatePath("/produtos");
}
