"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { compare } from "bcrypt-ts";
import { createSession, destroySession, findUserByEmail } from "@/lib/auth";

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

  const user = await findUserByEmail(parsed.data.email);
  if (!user) return { error: "E-mail ou senha incorretos." };

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
