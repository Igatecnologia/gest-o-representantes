import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { db, schema } from "./db";
import { and, eq } from "drizzle-orm";

const COOKIE = "session";
const ALG = "HS256";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET ausente ou muito curto (mínimo 32 chars).");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string; // user id
  email: string;
  name: string;
  role: "admin" | "manager" | "rep";
};

const SESSION_MAX_AGE = 60 * 60 * 24; // 1 dia

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
});

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});

export async function requireAdmin() {
  const session = await requireUser();
  if (session.role !== "admin" && session.role !== "manager") {
    redirect("/dashboard");
  }
  return session;
}

export function isAdmin(session: SessionPayload): boolean {
  return session.role === "admin" || session.role === "manager";
}

/**
 * Retorna o `representative` vinculado ao usuário logado (ou null se for admin
 * sem vínculo, ou se o vínculo não existir).
 */
export const getCurrentRep = cache(async (session: SessionPayload) => {
  const [rep] = await db
    .select()
    .from(schema.representatives)
    .where(and(
      eq(schema.representatives.userId, session.sub),
      eq(schema.representatives.active, true)
    ))
    .limit(1);
  return rep ?? null;
});

/**
 * Retorna `{ isAdmin, repId }`. Admin pode não ter `repId`.
 * Rep sempre tem `repId` — se não tiver, bloqueia acesso (estado inválido).
 * Verifica se o usuário ainda está ativo no banco (proteção contra tokens de contas desativadas).
 */
export const requireScope = cache(async () => {
  const session = await requireUser();

  // Verificar se usuário ainda está ativo e role não mudou
  const [user] = await db
    .select({ active: schema.users.active, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, session.sub))
    .limit(1);

  if (!user || !user.active) {
    const jar = await cookies();
    jar.delete("session");
    redirect("/login");
  }

  // Se role mudou desde a emissão do token, forçar re-login
  if (user.role !== session.role) {
    const jar = await cookies();
    jar.delete("session");
    redirect("/login");
  }

  if (isAdmin(session)) {
    return { session, isAdmin: true as const, repId: null };
  }
  const rep = await getCurrentRep(session);
  if (!rep) {
    // Rep sem vínculo — admin esqueceu de associar. Desloga preventivamente.
    redirect("/login");
  }
  return { session, isAdmin: false as const, repId: rep.id };
});

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return row ?? null;
}
