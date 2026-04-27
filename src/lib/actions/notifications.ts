"use server";

import { db, schema } from "@/lib/db";
import { and, eq, gte, lte, sql, desc, isNotNull } from "drizzle-orm";
import { requireScope } from "@/lib/auth";

export type Notification = {
  id: string;
  type: "followup" | "stale_deal" | "expiring_proposal" | "new_won_deal" | "new_paid_commission";
  title: string;
  description: string;
  href: string;
  date: Date | null;
  tone: "info" | "warning" | "success" | "danger";
};

/**
 * Agrega notificações de várias fontes em tempo real.
 * Não usa tabela própria — computa on-demand das tabelas existentes.
 * Sem persistência de "lido/não lido" (versão lite).
 */
export async function getNotifications(): Promise<Notification[]> {
  try {
    const { isAdmin, repId } = await requireScope();
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const repFilter = isAdmin ? undefined : eq;

    // Roda tudo em paralelo
    const [
      todayFollowUps,
      staleDeals,
      expiringProposals,
      recentWonDeals,
      recentPaidCommissions,
    ] = await Promise.all([
      // 1. Retornos pendentes pra hoje
      db
        .select({
          id: schema.followUps.id,
          customerName: schema.customers.name,
          scheduledDate: schema.followUps.scheduledDate,
          notes: schema.followUps.notes,
        })
        .from(schema.followUps)
        .leftJoin(
          schema.customers,
          eq(schema.customers.id, schema.followUps.customerId),
        )
        .where(
          and(
            eq(schema.followUps.status, "pending"),
            gte(schema.followUps.scheduledDate, todayStart),
            lte(schema.followUps.scheduledDate, todayEnd),
            ...(!isAdmin
              ? [eq(schema.followUps.representativeId, repId)]
              : []),
          ),
        )
        .limit(10)
        .catch(() => [] as { id: string; customerName: string | null; scheduledDate: Date | null; notes: string | null }[]),

      // 2. Deals parados (30+ dias, sem fechamento)
      db
        .select({
          id: schema.deals.id,
          title: schema.deals.title,
          customerName: schema.customers.name,
          createdAt: schema.deals.createdAt,
        })
        .from(schema.deals)
        .leftJoin(
          schema.customers,
          eq(schema.customers.id, schema.deals.customerId),
        )
        .where(
          and(
            sql`${schema.deals.stage} NOT IN ('won', 'lost')`,
            sql`${schema.deals.createdAt} < ${thirtyDaysAgo.getTime()}`,
            ...(!isAdmin ? [eq(schema.deals.representativeId, repId)] : []),
          ),
        )
        .limit(5),

      // 3. Propostas expirando nos próximos 7 dias
      db
        .select({
          id: schema.proposals.id,
          customerName: schema.customers.name,
          validUntil: schema.proposals.validUntil,
        })
        .from(schema.proposals)
        .leftJoin(
          schema.customers,
          eq(schema.customers.id, schema.proposals.customerId),
        )
        .where(
          and(
            eq(schema.proposals.status, "sent"),
            isNotNull(schema.proposals.validUntil),
            gte(schema.proposals.validUntil, now),
            lte(schema.proposals.validUntil, sevenDaysFromNow),
            ...(!isAdmin
              ? [eq(schema.proposals.representativeId, repId)]
              : []),
          ),
        )
        .orderBy(schema.proposals.validUntil)
        .limit(5),

      // 4. Negócios recém-ganhos (últimos 7 dias) — celebra vitórias
      db
        .select({
          id: schema.deals.id,
          title: schema.deals.title,
          value: schema.deals.value,
          customerName: schema.customers.name,
          updatedAt: schema.deals.createdAt, // não temos updatedAt no schema, usa createdAt
        })
        .from(schema.deals)
        .leftJoin(
          schema.customers,
          eq(schema.customers.id, schema.deals.customerId),
        )
        .where(
          and(
            eq(schema.deals.stage, "won"),
            gte(schema.deals.createdAt, sevenDaysFromNow),
            ...(!isAdmin ? [eq(schema.deals.representativeId, repId)] : []),
          ),
        )
        .orderBy(desc(schema.deals.createdAt))
        .limit(3),

      // 5. Comissões pagas recentemente (últimos 7 dias) — pra reps
      isAdmin
        ? Promise.resolve([])
        : db
            .select({
              id: schema.commissions.id,
              amount: schema.commissions.amount,
              paidAt: schema.commissions.paidAt,
            })
            .from(schema.commissions)
            .where(
              and(
                eq(schema.commissions.status, "paid"),
                eq(schema.commissions.representativeId, repId),
                gte(
                  schema.commissions.paidAt,
                  new Date(now.getTime() - 7 * 24 * 3600 * 1000),
                ),
              ),
            )
            .orderBy(desc(schema.commissions.paidAt))
            .limit(3),
    ]);

    const notifications: Notification[] = [];

    for (const f of todayFollowUps) {
      notifications.push({
        id: `fu-${f.id}`,
        type: "followup",
        title: "Retorno pra hoje",
        description: f.customerName
          ? `${f.customerName} — ${f.notes?.slice(0, 50) ?? "sem notas"}`
          : "Retorno agendado",
        href: "/retornos",
        date: f.scheduledDate,
        tone: "info",
      });
    }

    for (const d of staleDeals) {
      const days = Math.floor(
        (now.getTime() - new Date(d.createdAt).getTime()) /
          (24 * 3600 * 1000),
      );
      notifications.push({
        id: `stale-${d.id}`,
        type: "stale_deal",
        title: "Negócio parado",
        description: `${d.title} (${d.customerName ?? "—"}) — ${days} dias`,
        href: `/pipeline/${d.id}/editar`,
        date: d.createdAt,
        tone: "warning",
      });
    }

    for (const p of expiringProposals) {
      notifications.push({
        id: `exp-${p.id}`,
        type: "expiring_proposal",
        title: "Proposta expirando",
        description: `${p.customerName ?? "Proposta"} — válida até breve`,
        href: `/propostas/${p.id}`,
        date: p.validUntil,
        tone: "warning",
      });
    }

    for (const w of recentWonDeals) {
      notifications.push({
        id: `won-${w.id}`,
        type: "new_won_deal",
        title: "Negócio fechado 🎉",
        description: `${w.title} — ${w.customerName ?? "—"}`,
        href: `/pipeline/${w.id}/editar`,
        date: w.updatedAt,
        tone: "success",
      });
    }

    for (const c of recentPaidCommissions) {
      notifications.push({
        id: `paid-${c.id}`,
        type: "new_paid_commission",
        title: "Comissão paga",
        description: "Pagamento confirmado",
        href: "/comissoes",
        date: c.paidAt,
        tone: "success",
      });
    }

    // Ordena por urgência (warning primeiro, depois info, success por último)
    const tonePriority: Record<string, number> = {
      warning: 0,
      danger: 0,
      info: 1,
      success: 2,
    };
    notifications.sort(
      (a, b) => tonePriority[a.tone] - tonePriority[b.tone],
    );

    return notifications;
  } catch (err) {
    console.error("[getNotifications]", err);
    return [];
  }
}
