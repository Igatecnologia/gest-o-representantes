"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireScope } from "@/lib/auth";

const rowSchema = z.object({
  name: z.string().min(2, "Nome obrigatório (mínimo 2 chars)"),
  tradeName: z.string().optional(),
  document: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  cep: z.string().optional(),
  notes: z.string().optional(),
});

type ImportRow = z.infer<typeof rowSchema>;

export async function importCustomersAction(rows: ImportRow[]) {
  const { isAdmin, repId, session } = await requireScope();

  if (!isAdmin && !repId) {
    return { error: "Sem permissão." };
  }

  // Valida cada linha (já validamos no client mas reforça aqui)
  const validRows: ImportRow[] = [];
  const errors: { line: number; error: string }[] = [];

  rows.forEach((row, i) => {
    const parsed = rowSchema.safeParse(row);
    if (parsed.success) {
      validRows.push(parsed.data);
    } else {
      errors.push({
        line: i + 2, // +2 porque linha 1 é header e index é 0-based
        error: parsed.error.issues[0]?.message ?? "Inválido",
      });
    }
  });

  if (validRows.length === 0) {
    return { error: "Nenhuma linha válida encontrada.", errors };
  }

  // Limita batch a 1000 pra evitar timeout/abuso
  if (validRows.length > 1000) {
    return { error: "Máximo 1000 clientes por importação." };
  }

  // Insere em lote — atribui ao rep logado se não for admin
  // Admin importa sem dono (rep null = pool), pode atribuir depois
  const ownerRepId = isAdmin ? null : repId;

  try {
    await db.insert(schema.customers).values(
      validRows.map((r) => ({
        representativeId: ownerRepId,
        name: r.name,
        tradeName: r.tradeName || null,
        document: r.document?.replace(/\D/g, "") || null,
        email: r.email || null,
        phone: r.phone?.replace(/\D/g, "") || null,
        city: r.city || null,
        state: r.state?.toUpperCase() || null,
        cep: r.cep?.replace(/\D/g, "") || null,
        notes: r.notes || null,
        source: "csv_import",
      })),
    );

    revalidateTag("customers");
    revalidatePath("/clientes");

    return {
      success: true,
      imported: validRows.length,
      skipped: errors.length,
      errors,
    };
  } catch (err) {
    console.error("[importCustomersAction]", err);
    return { error: "Erro ao salvar no banco. Tente novamente." };
  }
}
