import { hash } from "bcrypt-ts";
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";

async function ensureUser(params: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "manager" | "rep";
}) {
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, params.email))
    .limit(1);

  if (existing) return existing;

  const passwordHash = await hash(params.password, 10);
  const [created] = await db
    .insert(schema.users)
    .values({
      email: params.email,
      passwordHash,
      name: params.name,
      role: params.role,
    })
    .returning();
  return created;
}

async function ensureRep(params: {
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  commissionPct: number;
}) {
  // Procura por userId se houver, senão por nome
  if (params.userId) {
    const [existing] = await db
      .select()
      .from(schema.representatives)
      .where(eq(schema.representatives.userId, params.userId))
      .limit(1);
    if (existing) return existing;
  }

  const [created] = await db
    .insert(schema.representatives)
    .values({
      userId: params.userId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      commissionPct: params.commissionPct,
      active: true,
    })
    .returning();
  return created;
}

async function main() {
  console.log("Seed iniciado…");

  const admin = await ensureUser({
    email: "redacted@example.com",
    password: "REDACTED",
    name: "Administrador",
    role: "admin",
  });
  console.log("  ✓ Admin:", admin.email);

  const joaoUser = await ensureUser({
    email: "redacted@example.com",
    password: "REDACTED",
    name: "João Silva",
    role: "rep",
  });
  const joaoRep = await ensureRep({
    userId: joaoUser.id,
    name: "João Silva",
    email: "redacted@example.com",
    phone: "(11) 99999-0001",
    commissionPct: 10,
  });
  console.log("  ✓ Rep 1:", joaoUser.email, "→", joaoRep.name);

  const mariaUser = await ensureUser({
    email: "redacted@example.com",
    password: "REDACTED",
    name: "Maria Santos",
    role: "rep",
  });
  const mariaRep = await ensureRep({
    userId: mariaUser.id,
    name: "Maria Santos",
    email: "redacted@example.com",
    phone: "(11) 99999-0002",
    commissionPct: 12,
  });
  console.log("  ✓ Rep 2:", mariaUser.email, "→", mariaRep.name);

  console.log("\nSeed concluído. Credenciais:");
  console.log("  Admin:  redacted@example.com / REDACTED");
  console.log("  Rep 1:  redacted@example.com / REDACTED");
  console.log("  Rep 2:  redacted@example.com / REDACTED");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
