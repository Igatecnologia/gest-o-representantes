"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function markCommissionPaidAction(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await db
    .update(schema.commissions)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(schema.commissions.id, id));

  await audit(session, "status_change", "commission", id, { status: "paid" });
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
