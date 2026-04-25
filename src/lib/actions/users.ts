"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { hash } from "bcrypt-ts";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

const createUserSchema = z.object({
  name: z.string().min(2, "Nome obrigatório (mín. 2 caracteres)."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres."),
  role: z.enum(["admin", "manager", "rep"], {
    errorMap: () => ({ message: "Perfil inválido." }),
  }),
  representativeId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Nome obrigatório (mín. 2 caracteres)."),
  email: z.string().email("E-mail inválido."),
  role: z.enum(["admin", "manager", "rep"], {
    errorMap: () => ({ message: "Perfil inválido." }),
  }),
  active: z.union([z.literal("on"), z.literal(null), z.literal("")]).optional(),
  representativeId: z.string().optional(),
});

type ActionState = { error?: string; success?: string };

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    representativeId: formData.get("representativeId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;

  // E-mail duplicado?
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, d.email.toLowerCase()))
    .limit(1);

  if (existing) {
    return { error: `Já existe um usuário com o e-mail ${d.email}.` };
  }

  const passwordHash = await hash(d.password, 10);

  const [created] = await db
    .insert(schema.users)
    .values({
      email: d.email.toLowerCase(),
      passwordHash,
      name: d.name,
      role: d.role,
    })
    .returning();

  // Vincular a representante se escolhido
  if (d.role === "rep" && d.representativeId) {
    await db
      .update(schema.representatives)
      .set({ userId: created.id })
      .where(eq(schema.representatives.id, d.representativeId));
  }

  revalidatePath("/configuracoes/acessos");
  return { success: `Usuário ${d.name} criado com sucesso.` };
}

export async function updateUserAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    active: formData.get("active"),
    representativeId: formData.get("representativeId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;

  // E-mail duplicado (outro user)?
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, d.email.toLowerCase()))
    .limit(1);

  if (existing && existing.id !== id) {
    return { error: `Já existe outro usuário com o e-mail ${d.email}.` };
  }

  await db
    .update(schema.users)
    .set({
      name: d.name,
      email: d.email.toLowerCase(),
      role: d.role,
      active: d.active === "on",
    })
    .where(eq(schema.users.id, id));

  // Desvincular representante antigo deste user
  await db
    .update(schema.representatives)
    .set({ userId: null })
    .where(eq(schema.representatives.userId, id));

  // Vincular novo representante se for rep
  if (d.role === "rep" && d.representativeId) {
    await db
      .update(schema.representatives)
      .set({ userId: id })
      .where(eq(schema.representatives.id, d.representativeId));
  }

  revalidatePath("/configuracoes/acessos");
  return { success: `Usuário ${d.name} atualizado.` };
}

export async function resetPasswordAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const newPassword = formData.get("newPassword");
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return { error: "Senha deve ter no mínimo 8 caracteres." };
  }

  const passwordHash = await hash(newPassword, 10);
  await db
    .update(schema.users)
    .set({ passwordHash })
    .where(eq(schema.users.id, id));

  revalidatePath("/configuracoes/acessos");
  return { success: "Senha redefinida com sucesso." };
}

export async function toggleUserActiveAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  const active = formData.get("active") === "true";
  if (typeof id !== "string") return;

  await db
    .update(schema.users)
    .set({ active })
    .where(eq(schema.users.id, id));

  revalidatePath("/configuracoes/acessos");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") return;

  // Desvincular representante antes de deletar
  await db
    .update(schema.representatives)
    .set({ userId: null })
    .where(eq(schema.representatives.userId, id));

  await db.delete(schema.users).where(eq(schema.users.id, id));

  revalidatePath("/configuracoes/acessos");
}
