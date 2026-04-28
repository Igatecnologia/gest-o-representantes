import webpush from "web-push";
import { env } from "./env";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(
    env.VAPID_SUBJECT || "mailto:contato@iga.com.br",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string; // pra onde abrir ao clicar
  tag?: string; // dedupe — notificações com mesma tag substituem
  icon?: string;
};

/**
 * Envia push pra todos os subscriptions ativos de um usuário.
 * Não joga erro — apenas registra no console e remove subscriptions inválidas.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  if (!ensureConfigured()) {
    console.warn("[push] VAPID não configurado — pulando");
    return { sent: 0, removed: 0 };
  }

  const subs = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, userId));

  if (subs.length === 0) return { sent: 0, removed: 0 };

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    tag: payload.tag,
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  });

  let sent = 0;
  let removed = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        message,
      );
      sent++;
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      // 410 = Gone (subscription expirada/removida pelo navegador)
      // 404 = endpoint inválido
      if (e.statusCode === 410 || e.statusCode === 404) {
        await db
          .delete(schema.pushSubscriptions)
          .where(eq(schema.pushSubscriptions.id, sub.id));
        removed++;
      } else {
        console.error("[push] falha ao enviar", e);
      }
    }
  }
  return { sent, removed };
}
