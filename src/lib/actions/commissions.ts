"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendPushToUser } from "@/lib/push";
import { brl } from "@/lib/utils";

export async function markCommissionPaidAction(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  // Pega a comissão antes pra notificar o rep correto
  const [comm] = await db
    .select({
      amount: schema.commissions.amount,
      repId: schema.commissions.representativeId,
      repUserId: schema.representatives.userId,
    })
    .from(schema.commissions)
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.commissions.representativeId),
    )
    .where(eq(schema.commissions.id, id))
    .limit(1);

  await db
    .update(schema.commissions)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(schema.commissions.id, id));

  await audit(session, "status_change", "commission", id, { status: "paid" });

  // Push notification pro rep (se tiver user vinculado e push ativo)
  if (comm?.repUserId) {
    sendPushToUser(comm.repUserId, {
      title: "💰 Comissão paga!",
      body: `Você recebeu ${brl(comm.amount)}`,
      url: "/comissoes",
      tag: `commission-paid-${id}`,
    }).catch((err) =>
      console.error("[markCommissionPaid] push failed", err),
    );
  }

  revalidatePath("/comissoes");
  revalidatePath("/dashboard");
}

export async function revertCommissionAction(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await db
    .update(schema.commissions)
    .set({ status: "pending", paidAt: null })
    .where(eq(schema.commissions.id, id));

  await audit(session, "status_change", "commission", id, { status: "reverted_to_pending" });
  revalidatePath("/comissoes");
  revalidatePath("/dashboard");
}
