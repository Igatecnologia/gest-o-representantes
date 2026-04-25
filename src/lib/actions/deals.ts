"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { DEAL_STAGES, type DealStage } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { toCents } from "@/lib/utils";

const STAGES = DEAL_STAGES.map((s) => s.id) as [DealStage, ...DealStage[]];

const dealSchema = z.object({
  title: z.string().min(2),
  customerId: z.string().min(1),
  representativeId: z.string().min(1),
  productId: z.string().optional(),
  value: z.coerce.number().nonnegative(),
  stage: z.enum(STAGES).default("lead"),
  probability: z.coerce.number().min(0).max(100).default(20),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function createDealAction(_prev: unknown, formData: FormData) {
  const { isAdmin, repId } = await requireScope();

  const parsed = dealSchema.safeParse({
    title: formData.get("title"),
    customerId: formData.get("customerId"),
    representativeId: isAdmin
      ? formData.get("representativeId")
      : repId,
    productId: formData.get("productId") || undefined,
    value: formData.get("value") ?? 0,
    stage: formData.get("stage") ?? "lead",
    probability: formData.get("probability") ?? 20,
    expectedCloseDate: formData.get("expectedCloseDate") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;

  await db.insert(schema.deals).values({
    title: d.title,
    customerId: d.customerId,
    representativeId: d.representativeId,
    productId: d.productId || null,
    value: toCents(d.value),
    stage: d.stage,
    probability: d.probability,
    expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate) : null,
    notes: d.notes || null,
  });

  revalidatePath("/pipeline");
  redirect("/pipeline");
}

export async function moveDealAction({
  dealId,
  toStage,
}: {
  dealId: string;
  toStage: DealStage;
}) {
  const { isAdmin, repId } = await requireScope();

  const stageMeta = DEAL_STAGES.find((s) => s.id === toStage);
  if (!stageMeta) return { error: "Stage inválido." };

  const isClosed = toStage === "won" || toStage === "lost";

  // Rep só pode mover os próprios deals
  const whereClause = isAdmin
    ? eq(schema.deals.id, dealId)
    : and(eq(schema.deals.id, dealId), eq(schema.deals.representativeId, repId));

  await db
    .update(schema.deals)
    .set({
      stage: toStage,
      probability: stageMeta.probability,
      closedAt: isClosed ? new Date() : null,
    })
    .where(whereClause);

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function deleteDealAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const whereClause = isAdmin
    ? eq(schema.deals.id, id)
    : and(eq(schema.deals.id, id), eq(schema.deals.representativeId, repId));

  await db.delete(schema.deals).where(whereClause);
  revalidatePath("/pipeline");
}

/**
 * Converte um deal em venda (quando cai no estágio "won") — cria o registro
 * na tabela `sales` e comissão correspondente.
 */
export async function convertDealToSaleAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const dealId = formData.get("dealId");
  if (typeof dealId !== "string") return { error: "ID inválido." };

  const whereClause = isAdmin
    ? eq(schema.deals.id, dealId)
    : and(eq(schema.deals.id, dealId), eq(schema.deals.representativeId, repId));

  const [deal] = await db
    .select()
    .from(schema.deals)
    .where(whereClause)
    .limit(1);

  if (!deal) return { error: "Deal não encontrado." };
  if (!deal.productId) return { error: "Deal sem produto — não é possível converter." };

  const [rep] = await db
    .select()
    .from(schema.representatives)
    .where(eq(schema.representatives.id, deal.representativeId))
    .limit(1);

  if (!rep) return { error: "Representante não encontrado." };

  // deal.value já está em centavos no DB
  const commissionAmount = Math.round((deal.value * rep.commissionPct) / 100);

  await db.transaction(async (tx) => {
    const [sale] = await tx
      .insert(schema.sales)
      .values({
        representativeId: deal.representativeId,
        customerId: deal.customerId,
        productId: deal.productId!,
        quantity: 1,
        unitPrice: deal.value,
        discount: 0,
        total: deal.value,
        status: "approved",
        notes: `Convertido do deal #${deal.id}`,
      })
      .returning();

    await tx.insert(schema.commissions).values({
      saleId: sale.id,
      representativeId: deal.representativeId,
      amount: commissionAmount,
      status: "pending",
    });

    await tx
      .update(schema.deals)
      .set({ stage: "won", probability: 100, closedAt: new Date() })
      .where(eq(schema.deals.id, dealId));
  });

  revalidatePath("/pipeline");
  revalidatePath("/vendas");
  revalidatePath("/comissoes");
  revalidatePath("/dashboard");

  return { ok: true };
}
