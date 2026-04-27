"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { toCents } from "@/lib/utils";
import { audit } from "@/lib/audit";

const saleSchema = z.object({
  representativeId: z.string().min(1),
  customerId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export async function createSaleAction(_prev: unknown, formData: FormData) {
  const { isAdmin, repId } = await requireScope();

  const parsed = saleSchema.safeParse({
    representativeId: isAdmin ? formData.get("representativeId") : repId,
    customerId: formData.get("customerId"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    discount: formData.get("discount") ?? 0,
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { representativeId, customerId, productId, quantity, unitPrice, discount, notes } =
    parsed.data;

  // Validar que o cliente pertence ao rep
  if (!isAdmin) {
    const [customer] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(and(
        eq(schema.customers.id, customerId),
        eq(schema.customers.representativeId, repId)
      ))
      .limit(1);
    if (!customer) return { error: "Cliente não encontrado." };
  }

  const unitPriceCents = toCents(unitPrice);
  const discountCents = toCents(discount);
  const totalCents = Math.max(0, quantity * unitPriceCents - discountCents);

  // Busca representante e produto
  const [[rep], [product]] = await Promise.all([
    db
      .select()
      .from(schema.representatives)
      .where(eq(schema.representatives.id, representativeId))
      .limit(1),
    db
      .select({ implementationPrice: schema.products.implementationPrice })
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1),
  ]);

  if (!rep) return { error: "Representante não encontrado." };
  if (!product) return { error: "Produto não encontrado." };

  // Comissão calculada sobre o valor de implantação, não sobre o total da venda
  const implCents = product.implementationPrice * quantity;
  const commissionAmount = Math.round((implCents * rep.commissionPct) / 100);

  // Transação: cria venda + comissão
  await db.transaction(async (tx) => {
    const [sale] = await tx
      .insert(schema.sales)
      .values({
        representativeId,
        customerId,
        productId,
        quantity,
        unitPrice: unitPriceCents,
        discount: discountCents,
        total: totalCents,
        status: "approved",
        notes: notes || null,
      })
      .returning();

    await tx.insert(schema.commissions).values({
      saleId: sale.id,
      representativeId,
      amount: commissionAmount,
      status: "pending",
    });
  });

  revalidatePath("/vendas");
  revalidatePath("/comissoes");
  revalidatePath("/dashboard");
  redirect("/vendas");
}

export async function cancelSaleAction(formData: FormData) {
  const { session, isAdmin, repId } = await requireScope();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  // Rep só cancela as próprias vendas
  const whereClause = isAdmin
    ? eq(schema.sales.id, id)
    : and(eq(schema.sales.id, id), eq(schema.sales.representativeId, repId));

  await db.transaction(async (tx) => {
    await tx.update(schema.sales).set({ status: "cancelled" }).where(whereClause);
    await tx
      .update(schema.commissions)
      .set({ amount: 0, status: "pending" })
      .where(eq(schema.commissions.saleId, id));
  });

  await audit(session, "cancel", "sale", id);
  revalidatePath("/vendas");
  revalidatePath("/comissoes");
  revalidatePath("/dashboard");
}
