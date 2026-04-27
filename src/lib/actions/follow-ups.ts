"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lte, sql, desc, asc } from "drizzle-orm";
import { requireScope } from "@/lib/auth";

const createSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente."),
  proposalId: z.string().optional(),
  dealId: z.string().optional(),
  scheduledDate: z.string().min(1, "Informe a data de retorno."),
  type: z.enum(["proposal_sent", "negotiation", "post_sale", "general"]),
  notes: z.string().min(3, "Descreva o motivo do retorno (mínimo 3 caracteres)."),
});

export async function createFollowUpAction(input: {
  customerId: string;
  proposalId?: string;
  dealId?: string;
  scheduledDate: string;
  type: string;
  notes?: string;
}) {
  // requireScope fora do try/catch — redirect precisa propagar
  const { isAdmin, repId } = await requireScope();

  if (!repId && !isAdmin) {
    return { error: "Representante não vinculado." };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;

  // Valida data antes de tentar inserir
  const scheduledDate = new Date(d.scheduledDate);
  if (Number.isNaN(scheduledDate.getTime())) {
    return { error: "Data de retorno inválida." };
  }

  try {
    let finalRepId = repId;
    if (!finalRepId && isAdmin) {
      const [firstRep] = await db
        .select({ id: schema.representatives.id })
        .from(schema.representatives)
        .where(eq(schema.representatives.active, true))
        .limit(1);
      if (!firstRep) return { error: "Nenhum representante ativo cadastrado." };
      finalRepId = firstRep.id;
    }

    // Confirma que customer existe (e pertence ao rep, se não for admin) — evita FK violation opaca
    const [customer] = await db
      .select({ id: schema.customers.id, repId: schema.customers.representativeId })
      .from(schema.customers)
      .where(eq(schema.customers.id, d.customerId))
      .limit(1);
    if (!customer) {
      return { error: "Cliente não encontrado." };
    }
    if (!isAdmin && customer.repId !== repId) {
      return { error: "Cliente não pertence ao seu cadastro." };
    }

    await db.insert(schema.followUps).values({
      customerId: d.customerId,
      representativeId: finalRepId!,
      proposalId: d.proposalId || null,
      dealId: d.dealId || null,
      scheduledDate,
      type: d.type,
      notes: d.notes || null,
    });

    revalidatePath("/retornos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("[createFollowUpAction] erro ao salvar retorno", {
      err,
      input: { ...d, customerId: d.customerId.slice(0, 8) + "…" },
    });
    return { error: "Erro ao salvar retorno. Tente novamente." };
  }
}

export async function completeFollowUpAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const id = formData.get("id");
  const result = formData.get("result");
  const rescheduleDate = formData.get("rescheduleDate");

  if (typeof id !== "string") return;

  const where = isAdmin
    ? eq(schema.followUps.id, id)
    : and(eq(schema.followUps.id, id), eq(schema.followUps.representativeId, repId));

  // Marcar como feito
  await db
    .update(schema.followUps)
    .set({
      status: "done",
      result: typeof result === "string" && result.trim() ? result.trim() : null,
      completedAt: new Date(),
    })
    .where(where);

  // Se pediu reagendamento, criar novo follow-up
  if (typeof rescheduleDate === "string" && rescheduleDate) {
    const [original] = await db
      .select()
      .from(schema.followUps)
      .where(eq(schema.followUps.id, id))
      .limit(1);

    if (original) {
      await db.insert(schema.followUps).values({
        customerId: original.customerId,
        representativeId: original.representativeId,
        proposalId: original.proposalId,
        dealId: original.dealId,
        scheduledDate: new Date(rescheduleDate),
        type: original.type,
        notes: typeof result === "string" && result.trim()
          ? `Reagendado. Anterior: ${result.trim()}`
          : "Reagendado",
      });
    }
  }

  revalidatePath("/retornos");
  revalidatePath("/dashboard");
}

export async function skipFollowUpAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const id = formData.get("id");

  if (typeof id !== "string") return;

  const where = isAdmin
    ? eq(schema.followUps.id, id)
    : and(eq(schema.followUps.id, id), eq(schema.followUps.representativeId, repId));

  await db
    .update(schema.followUps)
    .set({ status: "skipped", completedAt: new Date() })
    .where(where);

  revalidatePath("/retornos");
  revalidatePath("/dashboard");
}

export async function deleteFollowUpAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const id = formData.get("id");

  if (typeof id !== "string") return;

  const where = isAdmin
    ? eq(schema.followUps.id, id)
    : and(eq(schema.followUps.id, id), eq(schema.followUps.representativeId, repId));

  await db.delete(schema.followUps).where(where);
  revalidatePath("/retornos");
  revalidatePath("/dashboard");
}

type FollowUpFilter = "today" | "week" | "month" | "overdue" | "all";
type FollowUpStatus = "pending" | "done" | "skipped" | "all";

export async function getFollowUps(
  filter: FollowUpFilter = "today",
  options: { status?: FollowUpStatus; from?: string; to?: string } = {},
) {
  try {
    const { isAdmin, repId } = await requireScope();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);

    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
    weekEnd.setHours(23, 59, 59, 999);

    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let dateCondition;

    // Range customizado tem precedência sobre filtros pré-definidos
    if (options.from || options.to) {
      const fromDate = options.from ? new Date(options.from + "T00:00:00") : null;
      const toDate = options.to ? new Date(options.to + "T23:59:59.999") : null;
      const parts = [
        ...(fromDate ? [gte(schema.followUps.scheduledDate, fromDate)] : []),
        ...(toDate ? [lte(schema.followUps.scheduledDate, toDate)] : []),
      ];
      dateCondition = parts.length ? and(...parts) : undefined;
    } else {
      switch (filter) {
        case "today":
          dateCondition = and(
            gte(schema.followUps.scheduledDate, todayStart),
            lte(schema.followUps.scheduledDate, todayEnd),
          );
          break;
        case "week":
          dateCondition = and(
            gte(schema.followUps.scheduledDate, todayStart),
            lte(schema.followUps.scheduledDate, weekEnd),
          );
          break;
        case "month":
          dateCondition = and(
            gte(schema.followUps.scheduledDate, todayStart),
            lte(schema.followUps.scheduledDate, monthEnd),
          );
          break;
        case "overdue":
          dateCondition = sql`${schema.followUps.scheduledDate} < ${todayStart.getTime()}`;
          break;
        case "all":
          dateCondition = undefined;
          break;
      }
    }

    const status = options.status ?? "pending";
    const statusCondition =
      status === "all" ? undefined : eq(schema.followUps.status, status);

    const conditions = [
      ...(statusCondition ? [statusCondition] : []),
      ...(dateCondition ? [dateCondition] : []),
      ...(!isAdmin ? [eq(schema.followUps.representativeId, repId)] : []),
    ];

    // Histórico (status != pending) ordena do mais recente; pendentes ordena cronologicamente
    const orderClause =
      status === "pending"
        ? asc(schema.followUps.scheduledDate)
        : desc(schema.followUps.scheduledDate);

    const results = await db
      .select({
        id: schema.followUps.id,
        customerId: schema.followUps.customerId,
        customerName: schema.customers.name,
        customerPhone: schema.customers.phone,
        representativeId: schema.followUps.representativeId,
        repName: schema.representatives.name,
        proposalId: schema.followUps.proposalId,
        dealId: schema.followUps.dealId,
        scheduledDate: schema.followUps.scheduledDate,
        type: schema.followUps.type,
        status: schema.followUps.status,
        notes: schema.followUps.notes,
        result: schema.followUps.result,
        completedAt: schema.followUps.completedAt,
        createdAt: schema.followUps.createdAt,
      })
      .from(schema.followUps)
      .leftJoin(schema.customers, eq(schema.customers.id, schema.followUps.customerId))
      .leftJoin(schema.representatives, eq(schema.representatives.id, schema.followUps.representativeId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderClause)
      .limit(100);

    return results;
  } catch (err) {
    console.error("[getFollowUps]", err);
    return [];
  }
}

export async function getFollowUpCounts() {
  try {
    const { isAdmin, repId } = await requireScope();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);

    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
    weekEnd.setHours(23, 59, 59, 999);

    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const scopeCondition = isAdmin
      ? eq(schema.followUps.status, "pending")
      : and(eq(schema.followUps.status, "pending"), eq(schema.followUps.representativeId, repId));

    const [counts] = await db
      .select({
        today: sql<number>`count(case when ${schema.followUps.scheduledDate} >= ${todayStart.getTime()} and ${schema.followUps.scheduledDate} <= ${todayEnd.getTime()} then 1 end)`,
        week: sql<number>`count(case when ${schema.followUps.scheduledDate} >= ${todayStart.getTime()} and ${schema.followUps.scheduledDate} <= ${weekEnd.getTime()} then 1 end)`,
        month: sql<number>`count(case when ${schema.followUps.scheduledDate} >= ${todayStart.getTime()} and ${schema.followUps.scheduledDate} <= ${monthEnd.getTime()} then 1 end)`,
        overdue: sql<number>`count(case when ${schema.followUps.scheduledDate} < ${todayStart.getTime()} then 1 end)`,
      })
      .from(schema.followUps)
      .where(scopeCondition);

    return counts ?? { today: 0, week: 0, month: 0, overdue: 0 };
  } catch (err) {
    console.error("[getFollowUpCounts]", err);
    return { today: 0, week: 0, month: 0, overdue: 0 };
  }
}

export async function getTodayFollowUpCount() {
  try {
    const { isAdmin, repId } = await requireScope();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);

    const conditions = [
      eq(schema.followUps.status, "pending"),
      gte(schema.followUps.scheduledDate, todayStart),
      lte(schema.followUps.scheduledDate, todayEnd),
      ...(!isAdmin ? [eq(schema.followUps.representativeId, repId)] : []),
    ];

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.followUps)
      .where(and(...conditions));

    return result?.count ?? 0;
  } catch (err) {
    console.error("[getTodayFollowUpCount]", err);
    return 0;
  }
}
