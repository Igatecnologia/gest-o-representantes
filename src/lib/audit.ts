import { db, schema } from "./db";
import type { SessionPayload } from "./auth";

type AuditAction = "create" | "update" | "delete" | "cancel" | "status_change";
type AuditEntity = "customer" | "representative" | "product" | "sale" | "commission" | "deal" | "proposal" | "user";

export async function audit(
  session: SessionPayload,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  details?: Record<string, unknown>
) {
  try {
    await db.insert(schema.auditLogs).values({
      userId: session.sub,
      userName: session.name,
      action,
      entity,
      entityId,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (err) {
    // Audit log não deve bloquear a operação principal
    console.error("[audit] Falha ao registrar log:", err);
  }
}
