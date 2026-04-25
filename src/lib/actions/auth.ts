"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { compare, hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { createSession, destroySession, findUserByEmail, requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const { blocked, retryAfterSeconds } = await checkRateLimit(
    `login:${parsed.data.email.toLowerCase()}`
  );
  if (blocked) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return {
      error: `Muitas tentativas. Tente novamente em ${minutes} minuto${minutes > 1 ? "s" : ""}.`,
    };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) return { error: "E-mail ou senha incorretos." };

  if (user.active === false) {
    return { error: "Conta desativada. Contate o administrador." };
  }

  const ok = await compare(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "E-mail ou senha incorretos." };

  await createSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "admin" | "manager" | "rep",
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória."),
  newPassword: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres."),
  confirmPassword: z.string().min(1, "Confirme a nova senha."),
});

export async function changePasswordAction(_prev: unknown, formData: FormData) {
  const session = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.sub))
    .limit(1);

  if (!user) return { error: "Usuário não encontrado." };

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Senha atual incorreta." };

  const newHash = await hash(newPassword, 10);
  await db
    .update(schema.users)
    .set({ passwordHash: newHash })
    .where(eq(schema.users.id, session.sub));

  // Recria a sessão (novo iat) — invalida tokens anteriores no próximo refresh do middleware
  await createSession({
    sub: session.sub,
    email: session.email,
    name: session.name,
    role: session.role,
  });

  return { success: "Senha alterada com sucesso." };
}
