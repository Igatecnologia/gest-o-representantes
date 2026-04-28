"use server";

import { z } from "zod";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().optional(),
});

export async function subscribePushAction(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) {
  const session = await requireUser();
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Subscription inválida." };
  }

  // Idempotente: se já existe pelo endpoint, atualiza userId/keys
  const [existing] = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, parsed.data.endpoint))
    .limit(1);

  if (existing) {
    await db
      .update(schema.pushSubscriptions)
      .set({
        userId: session.sub,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent: parsed.data.userAgent,
      })
      .where(eq(schema.pushSubscriptions.id, existing.id));
  } else {
    await db.insert(schema.pushSubscriptions).values({
      userId: session.sub,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
      userAgent: parsed.data.userAgent,
    });
  }

  return { success: true };
}

export async function unsubscribePushAction(endpoint: string) {
  const session = await requireUser();
  await db
    .delete(schema.pushSubscriptions)
    .where(
      and(
        eq(schema.pushSubscriptions.userId, session.sub),
        eq(schema.pushSubscriptions.endpoint, endpoint),
      ),
    );
  return { success: true };
}

/**
 * Envia notificação de teste pra própria subscription do usuário.
 * Usado pelo botão "Testar notificação" na UI.
 */
export async function sendTestPushAction() {
  const session = await requireUser();
  const result = await sendPushToUser(session.sub, {
    title: "🔔 IGA — Notificação de teste",
    body: "Tudo funcionando! Você vai receber alertas aqui.",
    url: "/dashboard",
    tag: "test",
  });
  return { success: true, ...result };
}
