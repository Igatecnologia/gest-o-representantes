"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq, asc, sql } from "drizzle-orm";
import { requireAdmin, requireScope } from "@/lib/auth";

const pipelineSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  color: z.enum(["primary", "emerald", "amber", "violet", "cyan", "rose"]),
  isDefault: z.union([z.literal("on"), z.literal(null), z.literal("")]).optional(),
  active: z.union([z.literal("on"), z.literal(null), z.literal("")]).optional(),
});

export async function createPipelineAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = pipelineSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    isDefault: formData.get("isDefault"),
    active: formData.get("active"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const isDefault = parsed.data.isDefault === "on";
  // Se for default, desmarca os outros
  if (isDefault) {
    await db
      .update(schema.pipelines)
      .set({ isDefault: false })
      .where(eq(schema.pipelines.isDefault, true));
  }

  // Position = max + 1
  const [maxRow] = await db
    .select({
      max: sql<number>`coalesce(max(${schema.pipelines.position}), 0)`,
    })
    .from(schema.pipelines);

  await db.insert(schema.pipelines).values({
    name: parsed.data.name,
    color: parsed.data.color,
    position: (maxRow?.max ?? 0) + 1,
    isDefault,
    active: parsed.data.active === "on",
  });

  revalidateTag("pipelines");
  revalidatePath("/configuracoes/funis");
  return { success: true };
}

export async function updatePipelineAction(
  id: string,
  _prev: unknown,
  formData: FormData,
) {
  await requireAdmin();
  const parsed = pipelineSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    isDefault: formData.get("isDefault"),
    active: formData.get("active"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const isDefault = parsed.data.isDefault === "on";
  if (isDefault) {
    await db
      .update(schema.pipelines)
      .set({ isDefault: false })
      .where(eq(schema.pipelines.isDefault, true));
  }

  await db
    .update(schema.pipelines)
    .set({
      name: parsed.data.name,
      color: parsed.data.color,
      isDefault,
      active: parsed.data.active === "on",
    })
    .where(eq(schema.pipelines.id, id));

  revalidateTag("pipelines");
  revalidatePath("/configuracoes/funis");
  return { success: true };
}

export async function deletePipelineAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "ID inválido." };

  // Antes de deletar, desvincula deals (vão pra null = funil padrão)
  await db
    .update(schema.deals)
    .set({ pipelineId: null })
    .where(eq(schema.deals.pipelineId, id));

  await db.delete(schema.pipelines).where(eq(schema.pipelines.id, id));

  revalidateTag("pipelines");
  revalidatePath("/configuracoes/funis");
  revalidatePath("/pipeline");
  return { success: true };
}

export const getActivePipelines = unstable_cache(
  async () =>
    db
      .select()
      .from(schema.pipelines)
      .where(eq(schema.pipelines.active, true))
      .orderBy(asc(schema.pipelines.position)),
  ["active-pipelines"],
  { revalidate: 300, tags: ["pipelines"] },
);

export async function getAllPipelines() {
  await requireScope();
  return db
    .select()
    .from(schema.pipelines)
    .orderBy(asc(schema.pipelines.position));
}
