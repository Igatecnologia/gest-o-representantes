"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcrypt-ts";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

const repSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  commissionPct: z.coerce.number().min(0).max(100),
  active: z.union([z.literal("on"), z.literal(null), z.literal("")]).optional(),
  // Login
  createLogin: z
    .union([z.literal("on"), z.literal(null), z.literal("")])
    .optional(),
  loginEmail: z.string().email().optional().or(z.literal("")),
  loginPassword: z.string().min(8).optional().or(z.literal("")),
});

export async function createRepAction(_prev: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = repSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    commissionPct: formData.get("commissionPct"),
    active: formData.get("active"),
    createLogin: formData.get("createLogin"),
    loginEmail: formData.get("loginEmail") ?? "",
    loginPassword: formData.get("loginPassword") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;
  const wantsLogin = d.createLogin === "on";

  let userId: string | null = null;

  if (wantsLogin) {
    if (!d.loginEmail || !d.loginPassword) {
      return { error: "Para criar acesso, informe e-mail e senha (mín. 6)." };
    }

    // email já existe?
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, d.loginEmail.toLowerCase()))
      .limit(1);
    if (existing) {
      return { error: `Já existe usuário com o e-mail ${d.loginEmail}.` };
    }

    const passwordHash = await hash(d.loginPassword, 10);
    const [created] = await db
      .insert(schema.users)
      .values({
        email: d.loginEmail.toLowerCase(),
        passwordHash,
        name: d.name,
        role: "rep",
      })
      .returning();
    userId = created.id;
  }

  await db.insert(schema.representatives).values({
    userId,
    name: d.name,
    email: d.email || null,
    phone: d.phone || null,
    commissionPct: d.commissionPct,
    active: d.active === "on",
  });

  revalidatePath("/representantes");
  redirect("/representantes");
}

export async function updateRepAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  await requireAdmin();

  const parsed = repSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    commissionPct: formData.get("commissionPct"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db
    .update(schema.representatives)
    .set({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      commissionPct: parsed.data.commissionPct,
      active: parsed.data.active === "on",
    })
    .where(eq(schema.representatives.id, id));

  revalidatePath("/representantes");
  redirect("/representantes");
}

export async function deleteRepAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await db.delete(schema.representatives).where(eq(schema.representatives.id, id));
  revalidatePath("/representantes");
}
