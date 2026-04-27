"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { requireScope } from "@/lib/auth";

const checkInSchema = z.object({
  customerId: z.string().min(1),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Calcula distância em metros entre 2 pontos GPS (Haversine).
 */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // raio da terra em metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function checkInVisitAction(input: {
  customerId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  notes?: string;
}) {
  const { isAdmin, repId } = await requireScope();

  if (!repId && !isAdmin) {
    return { error: "Apenas representantes podem fazer check-in." };
  }

  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  // Cliente existe e é deste rep (se não for admin)
  const [customer] = await db
    .select({
      id: schema.customers.id,
      lat: schema.customers.latitude,
      lng: schema.customers.longitude,
      ownerRep: schema.customers.representativeId,
    })
    .from(schema.customers)
    .where(eq(schema.customers.id, d.customerId))
    .limit(1);

  if (!customer) return { error: "Cliente não encontrado." };

  if (!isAdmin && customer.ownerRep !== repId) {
    return { error: "Cliente não pertence ao seu cadastro." };
  }

  // Distância (se cliente tem coords)
  let distanceMeters: number | null = null;
  if (customer.lat != null && customer.lng != null) {
    distanceMeters = haversineMeters(
      d.latitude,
      d.longitude,
      customer.lat,
      customer.lng,
    );
  }

  // Pra admin sem repId vinculado (raro), usa primeiro rep ativo
  let finalRepId = repId;
  if (!finalRepId && isAdmin) {
    const [firstRep] = await db
      .select({ id: schema.representatives.id })
      .from(schema.representatives)
      .where(eq(schema.representatives.active, true))
      .limit(1);
    if (!firstRep) return { error: "Nenhum representante ativo." };
    finalRepId = firstRep.id;
  }

  try {
    await db.insert(schema.visits).values({
      customerId: d.customerId,
      representativeId: finalRepId!,
      latitude: d.latitude,
      longitude: d.longitude,
      accuracy: d.accuracy,
      distanceMeters,
      notes: d.notes ?? null,
    });

    revalidatePath(`/clientes/${d.customerId}`);
    return {
      success: true,
      distanceMeters,
      message:
        distanceMeters === null
          ? "Visita registrada (cliente sem coordenadas pra validar)"
          : distanceMeters < 100
            ? `Check-in OK (a ${distanceMeters.toFixed(0)} m do cliente)`
            : distanceMeters < 500
              ? `Check-in registrado (a ${distanceMeters.toFixed(0)} m — fora do raio ideal)`
              : `Check-in registrado mas você está a ${(distanceMeters / 1000).toFixed(1)} km do cliente`,
    };
  } catch (err) {
    console.error("[checkInVisitAction]", err);
    return { error: "Erro ao registrar visita. Tente novamente." };
  }
}

export async function getVisitsForCustomer(customerId: string) {
  const { isAdmin, repId } = await requireScope();

  return db
    .select({
      id: schema.visits.id,
      latitude: schema.visits.latitude,
      longitude: schema.visits.longitude,
      distanceMeters: schema.visits.distanceMeters,
      notes: schema.visits.notes,
      createdAt: schema.visits.createdAt,
      repName: schema.representatives.name,
    })
    .from(schema.visits)
    .leftJoin(
      schema.representatives,
      eq(schema.representatives.id, schema.visits.representativeId),
    )
    .where(
      and(
        eq(schema.visits.customerId, customerId),
        ...(!isAdmin && repId
          ? [eq(schema.visits.representativeId, repId)]
          : []),
      ),
    )
    .orderBy(desc(schema.visits.createdAt))
    .limit(20);
}
