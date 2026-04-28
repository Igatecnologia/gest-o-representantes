"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAdmin, requireScope } from "@/lib/auth";

const templateSchema = z.object({
  category: z.enum(["whatsapp", "proposal_intro", "followup"]),
  title: z.string().min(2, "Título obrigatório"),
  body: z.string().min(5, "Mensagem muito curta"),
  active: z.union([z.literal("on"), z.literal(null), z.literal("")]).optional(),
});

export async function createTemplateAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = templateSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
    active: formData.get("active"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  await db.insert(schema.messageTemplates).values({
    category: parsed.data.category,
    title: parsed.data.title,
    body: parsed.data.body,
    active: parsed.data.active === "on",
  });
  revalidateTag("templates");
  revalidatePath("/configuracoes/templates");
  return { success: true };
}

export async function updateTemplateAction(
  id: string,
  _prev: unknown,
  formData: FormData,
) {
  await requireAdmin();
  const parsed = templateSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
    active: formData.get("active"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  await db
    .update(schema.messageTemplates)
    .set({
      category: parsed.data.category,
      title: parsed.data.title,
      body: parsed.data.body,
      active: parsed.data.active === "on",
    })
    .where(eq(schema.messageTemplates.id, id));
  revalidateTag("templates");
  revalidatePath("/configuracoes/templates");
  return { success: true };
}

export async function deleteTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "ID inválido." };
  await db
    .delete(schema.messageTemplates)
    .where(eq(schema.messageTemplates.id, id));
  revalidateTag("templates");
  revalidatePath("/configuracoes/templates");
  return { success: true };
}

/**
 * Templates ativos por categoria — disponíveis pra todos os usuários (rep
 * usa pra mandar mensagem). Cacheado em 5min, invalidado nas mutations.
 */
export const getActiveTemplates = unstable_cache(
  async (category?: "whatsapp" | "proposal_intro" | "followup") => {
    const where = category
      ? and(
          eq(schema.messageTemplates.active, true),
          eq(schema.messageTemplates.category, category),
        )
      : eq(schema.messageTemplates.active, true);
    return db
      .select()
      .from(schema.messageTemplates)
      .where(where)
      .orderBy(desc(schema.messageTemplates.createdAt));
  },
  ["active-templates"],
  { revalidate: 300, tags: ["templates"] },
);

export async function getAllTemplates() {
  await requireScope();
  return db
    .select()
    .from(schema.messageTemplates)
    .orderBy(desc(schema.messageTemplates.createdAt));
}
