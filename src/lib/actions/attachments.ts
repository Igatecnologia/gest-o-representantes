"use server";

import { put, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { requireScope } from "@/lib/auth";
import { z } from "zod";

const ENTITY_VALUES = ["customer", "proposal", "deal"] as const;
type Entity = (typeof ENTITY_VALUES)[number];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

/**
 * Verifica se o user pode ler/escrever no entity especificado.
 * - admin: tudo
 * - rep: customer/proposal/deal precisa ser dele
 */
async function assertOwnership(
  entity: Entity,
  entityId: string,
  isAdmin: boolean,
  repId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAdmin) return { ok: true };
  if (!repId) return { ok: false, error: "Sem permissão." };

  let ownerId: string | null = null;
  if (entity === "customer") {
    const [row] = await db
      .select({ rep: schema.customers.representativeId })
      .from(schema.customers)
      .where(eq(schema.customers.id, entityId))
      .limit(1);
    ownerId = row?.rep ?? null;
    // Customer pode estar sem rep (pool) — admin only nesse caso
    if (ownerId === null) return { ok: false, error: "Cliente sem dono." };
  } else if (entity === "proposal") {
    const [row] = await db
      .select({ rep: schema.proposals.representativeId })
      .from(schema.proposals)
      .where(eq(schema.proposals.id, entityId))
      .limit(1);
    ownerId = row?.rep ?? null;
  } else if (entity === "deal") {
    const [row] = await db
      .select({ rep: schema.deals.representativeId })
      .from(schema.deals)
      .where(eq(schema.deals.id, entityId))
      .limit(1);
    ownerId = row?.rep ?? null;
  }

  if (ownerId !== repId) {
    return { ok: false, error: "Sem permissão para este registro." };
  }
  return { ok: true };
}

const uploadSchema = z.object({
  entity: z.enum(ENTITY_VALUES),
  entityId: z.string().min(1),
});

export async function uploadAttachmentAction(formData: FormData) {
  const { isAdmin, repId, session } = await requireScope();

  const parsed = uploadSchema.safeParse({
    entity: formData.get("entity"),
    entityId: formData.get("entityId"),
  });
  if (!parsed.success) {
    return { error: "Parâmetros inválidos." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Arquivo não enviado." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Arquivo muito grande (máx 10 MB)." };
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return { error: "Tipo não permitido (use JPG/PNG/WEBP/HEIC ou PDF)." };
  }

  const ownership = await assertOwnership(
    parsed.data.entity,
    parsed.data.entityId,
    isAdmin,
    repId,
  );
  if (!ownership.ok) {
    return { error: ownership.error };
  }

  // Path: entity/entityId/timestamp-filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const path = `${parsed.data.entity}/${parsed.data.entityId}/${Date.now()}-${safeName}`;

  try {
    const blob = await put(path, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    await db.insert(schema.attachments).values({
      entity: parsed.data.entity,
      entityId: parsed.data.entityId,
      filename: file.name,
      url: blob.url,
      size: file.size,
      mimeType: file.type,
      uploadedBy: session.sub,
      uploadedByName: session.name,
    });

    // Revalida páginas que mostram anexos
    if (parsed.data.entity === "customer") {
      revalidatePath(`/clientes/${parsed.data.entityId}`);
    } else if (parsed.data.entity === "proposal") {
      revalidatePath(`/propostas/${parsed.data.entityId}`);
    } else if (parsed.data.entity === "deal") {
      revalidatePath(`/pipeline/${parsed.data.entityId}/editar`);
    }

    return { success: true, url: blob.url };
  } catch (err) {
    console.error("[uploadAttachmentAction]", err);
    return { error: "Erro ao salvar arquivo. Tente novamente." };
  }
}

export async function deleteAttachmentAction(formData: FormData) {
  const { isAdmin, repId } = await requireScope();
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "ID inválido." };

  const [att] = await db
    .select()
    .from(schema.attachments)
    .where(eq(schema.attachments.id, id))
    .limit(1);
  if (!att) return { error: "Anexo não encontrado." };

  const ownership = await assertOwnership(
    att.entity as Entity,
    att.entityId,
    isAdmin,
    repId,
  );
  if (!ownership.ok) {
    return { error: ownership.error };
  }

  try {
    await del(att.url);
  } catch (err) {
    console.error("[deleteAttachmentAction] blob delete failed", err);
    // continua mesmo se falhar — registra no DB que foi removido
  }

  await db
    .delete(schema.attachments)
    .where(eq(schema.attachments.id, id));

  if (att.entity === "customer") {
    revalidatePath(`/clientes/${att.entityId}`);
  } else if (att.entity === "proposal") {
    revalidatePath(`/propostas/${att.entityId}`);
  } else if (att.entity === "deal") {
    revalidatePath(`/pipeline/${att.entityId}/editar`);
  }

  return { success: true };
}

/**
 * Lista anexos de uma entidade. Server Component pode chamar direto.
 */
export async function getAttachments(entity: Entity, entityId: string) {
  const { isAdmin, repId } = await requireScope();
  const ownership = await assertOwnership(entity, entityId, isAdmin, repId);
  if (!ownership.ok) return [];

  return db
    .select()
    .from(schema.attachments)
    .where(
      and(
        eq(schema.attachments.entity, entity),
        eq(schema.attachments.entityId, entityId),
      ),
    )
    .orderBy(desc(schema.attachments.createdAt));
}
