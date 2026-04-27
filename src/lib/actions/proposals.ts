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

  // Validar que o cliente pertence ao rep
  if (!isAdmin && finalRepId) {
    const [customer] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(and(
        eq(schema.customers.id, d.customerId),
        eq(schema.customers.representativeId, finalRepId)
      ))
      .limit(1);
    if (!customer) return { error: "Cliente não encontrado." };
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

export async function updateProposalAction(input: {
  id: string;
  customerId: string;
  productId: string;
  validUntil?: string;
  notes?: string;
  items: { label: string; type: string; defaultValue: number; value: number }[];
}) {
  const { isAdmin, repId } = await requireScope();

  const parsed = proposalSchema.safeParse({
    ...input,
    representativeId: repId ?? "admin",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const d = parsed.data;

  // Verificar permissao
  const [existing] = await db
    .select({ id: schema.proposals.id, status: schema.proposals.status, representativeId: schema.proposals.representativeId })
    .from(schema.proposals)
    .where(eq(schema.proposals.id, input.id))
    .limit(1);

  if (!existing) return { error: "Proposta nao encontrada." };
  if (!isAdmin && existing.representativeId !== repId) return { error: "Sem permissao." };
  if (existing.status !== "draft") return { error: "Apenas propostas em rascunho podem ser editadas." };

  // Validar ownership do cliente
  if (!isAdmin && repId) {
    const [customer] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(and(
        eq(schema.customers.id, d.customerId),
        eq(schema.customers.representativeId, repId)
      ))
      .limit(1);
    if (!customer) return { error: "Cliente não encontrado." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.proposals)
      .set({
        customerId: d.customerId,
        productId: d.productId,
        validUntil: d.validUntil ? new Date(d.validUntil) : null,
        notes: d.notes || null,
      })
      .where(eq(schema.proposals.id, input.id));

    // Deletar items antigos e inserir novos
    await tx.delete(schema.proposalItems).where(eq(schema.proposalItems.proposalId, input.id));

    for (const item of d.items) {
      await tx.insert(schema.proposalItems).values({
        proposalId: input.id,
        label: item.label,
        type: item.type as "one_time" | "monthly" | "yearly",
        defaultValue: toCents(item.defaultValue),
        value: toCents(item.value),
      });
    }
  });

  revalidatePath("/propostas");
  revalidatePath(`/propostas/${input.id}`);
  redirect(`/propostas/${input.id}`);
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

export async function duplicateProposalAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const [original] = await db
    .select()
    .from(schema.proposals)
    .where(eq(schema.proposals.id, id))
    .limit(1);

  if (!original) return;
  if (!isAdmin && original.representativeId !== repId) return;

  const items = await db
    .select()
    .from(schema.proposalItems)
    .where(eq(schema.proposalItems.proposalId, id));

  const newProposal = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(schema.proposals)
      .values({
        customerId: original.customerId,
        representativeId: original.representativeId,
        productId: original.productId,
        status: "draft",
        validUntil: null,
        notes: original.notes,
      })
      .returning();

    for (const item of items) {
      await tx.insert(schema.proposalItems).values({
        proposalId: p.id,
        label: item.label,
        type: item.type as "one_time" | "monthly" | "yearly",
        defaultValue: item.defaultValue,
        value: item.value,
      });
    }

    return p;
  });

  revalidatePath("/propostas");
  redirect(`/propostas/${newProposal.id}`);
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
