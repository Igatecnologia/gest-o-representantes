import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, isNull } from "drizzle-orm";
import { UsersManager } from "./users-manager";

export const dynamic = "force-dynamic";

export default async function AcessosPage() {
  await requireAdmin();

  const users = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      active: schema.users.active,
      createdAt: schema.users.createdAt,
      repId: schema.representatives.id,
      repName: schema.representatives.name,
    })
    .from(schema.users)
    .leftJoin(schema.representatives, eq(schema.representatives.userId, schema.users.id))
    .orderBy(desc(schema.users.createdAt));

  // Representantes sem vínculo (para dropdown ao criar/editar user tipo rep)
  const unlinkedReps = await db
    .select({
      id: schema.representatives.id,
      name: schema.representatives.name,
    })
    .from(schema.representatives)
    .where(isNull(schema.representatives.userId));

  return (
    <UsersManager
      users={users.map((u) => ({
        ...u,
        active: u.active ?? true,
        createdAt: u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt),
      }))}
      unlinkedReps={unlinkedReps}
    />
  );
}
