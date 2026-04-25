"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { toCents } from "@/lib/utils";

const itemSchema = z.object({
  label: z.string().min(1),
  type: z.enum(["one_time", "monthly", "yearly"]),
  defaultValue: z.number().nonnegative(),
  value: z.number().nonnegative(),
});

const proposalSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente."),
  productId: z.string().min(1, "Selecione um produto."),
  representativeId: z.string().min(1),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Adicione pelo menos um item."),
});

export async function createProposalAction(input: {
  customerId: string;
  productId: string;
  validUntil?: string;
  notes?: string;
  items: { label: string; type: string; defaultValue: number; value: number }[];
}) {
  const { isAdmin, repId } = await requireScope();

  if (!repId && !isAdmin) {
    return { error: "Representante não vinculado." };
  }

  const parsed = proposalSchema.safeParse({
    ...input,
    representativeId: repId ?? "admin",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;
  // Rep usa seu próprio ID; admin sem vínculo usa o primeiro rep ativo
  let finalRepId = repId;
  if (!finalRepId && isAdmin) {
    const [firstRep] = await db
      .select({ id: schema.representatives.id })
      .from(schema.representatives)
      .where(eq(schema.representatives.active, true))
      .limit(1);
    if (!firstRep) return { error: "Nenhum representante ativo cadastrado." };
    finalRepId = firstRep.id;
  }

  const proposal = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(schema.proposals)
      .values({
        customerId: d.customerId,
        representativeId: finalRepId!,
        productId: d.productId,
        status: "draft",
        validUntil: d.validUntil ? new Date(d.validUntil) : null,
        notes: d.notes || null,
      })
      .returning();

    for (const item of d.items) {
      await tx.insert(schema.proposalItems).values({
        proposalId: p.id,
        label: item.label,
        type: item.type as "one_time" | "monthly" | "yearly",
        defaultValue: toCents(item.defaultValue),
        value: toCents(item.value),
      });
    }

    return p;
  });

  revalidatePath("/propostas");
  redirect(`/propostas/${proposal.id}`);
}

export async function updateProposalStatusAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || typeof status !== "string") return;

  const validStatuses = ["draft", "sent", "accepted", "rejected", "expired"];
  if (!validStatuses.includes(status)) return;

  const where = isAdmin
    ? eq(schema.proposals.id, id)
    : and(eq(schema.proposals.id, id), eq(schema.proposals.representativeId, repId));

  await db
    .update(schema.proposals)
    .set({ status })
    .where(where);

  revalidatePath("/propostas");
  revalidatePath(`/propostas/${id}`);
}

export async function deleteProposalAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const where = isAdmin
    ? eq(schema.proposals.id, id)
    : and(eq(schema.proposals.id, id), eq(schema.proposals.representativeId, repId));

  await db.delete(schema.proposals).where(where);
  revalidatePath("/propostas");
}
