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

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

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
export async function getCurrentRep(session: SessionPayload) {
  const [rep] = await db
    .select()
    .from(schema.representatives)
    .where(and(
      eq(schema.representatives.userId, session.sub),
      eq(schema.representatives.active, true)
    ))
    .limit(1);
  return rep ?? null;
}

/**
 * Retorna `{ isAdmin, repId }`. Admin pode não ter `repId`.
 * Rep sempre tem `repId` — se não tiver, bloqueia acesso (estado inválido).
 */
export async function requireScope() {
  const session = await requireUser();
  if (isAdmin(session)) {
    return { session, isAdmin: true as const, repId: null };
  }
  const rep = await getCurrentRep(session);
  if (!rep) {
    // Rep sem vínculo — admin esqueceu de associar. Desloga preventivamente.
    redirect("/login");
  }
  return { session, isAdmin: false as const, repId: rep.id };
}

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return row ?? null;
}
