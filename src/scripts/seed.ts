import { hash } from "bcrypt-ts";
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val || val.length < 8) {
    throw new Error(
      `${name} é obrigatória (mín. 8 chars). Defina via variável de ambiente.`
    );
  }
  return val;
}

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

  if (existing) {
    console.log(`  [skip] ${params.email} já existe.`);
    return existing;
  }

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
  console.log("Seed iniciado…\n");

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@iga.com.br";
  const adminName = process.env.ADMIN_NAME ?? "Administrador IGA";
  const adminPw = requireEnv("ADMIN_PASSWORD");

  const admin = await ensureUser({
    email: adminEmail,
    password: adminPw,
    name: adminName,
    role: "admin",
  });
  console.log("  Admin:", admin.email);

  // Representantes são opcionais — passe REP1_EMAIL + REP1_PASSWORD para criar
  if (process.env.REP1_EMAIL && process.env.REP1_PASSWORD) {
    const rep1Pw = requireEnv("REP1_PASSWORD");
    const rep1Name = process.env.REP1_NAME ?? "Representante 1";
    const rep1User = await ensureUser({
      email: process.env.REP1_EMAIL,
      password: rep1Pw,
      name: rep1Name,
      role: "rep",
    });
    const rep1 = await ensureRep({
      userId: rep1User.id,
      name: rep1Name,
      email: process.env.REP1_EMAIL,
      phone: process.env.REP1_PHONE ?? null,
      commissionPct: Number(process.env.REP1_COMMISSION ?? 10),
    });
    console.log("  Rep 1:", rep1User.email, "→", rep1.name);
  }

  if (process.env.REP2_EMAIL && process.env.REP2_PASSWORD) {
    const rep2Pw = requireEnv("REP2_PASSWORD");
    const rep2Name = process.env.REP2_NAME ?? "Representante 2";
    const rep2User = await ensureUser({
      email: process.env.REP2_EMAIL,
      password: rep2Pw,
      name: rep2Name,
      role: "rep",
    });
    const rep2 = await ensureRep({
      userId: rep2User.id,
      name: rep2Name,
      email: process.env.REP2_EMAIL,
      phone: process.env.REP2_PHONE ?? null,
      commissionPct: Number(process.env.REP2_COMMISSION ?? 10),
    });
    console.log("  Rep 2:", rep2User.email, "→", rep2.name);
  }

  console.log("\nSeed concluído com sucesso.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✖ Erro no seed:", err.message);
    console.error("\nUso:");
    console.error("  ADMIN_PASSWORD=SenhaForte123! npm run db:seed");
    console.error("\nOpcionais:");
    console.error("  ADMIN_EMAIL, ADMIN_NAME");
    console.error("  REP1_EMAIL, REP1_PASSWORD, REP1_NAME, REP1_PHONE, REP1_COMMISSION");
    console.error("  REP2_EMAIL, REP2_PASSWORD, REP2_NAME, REP2_PHONE, REP2_COMMISSION");
    process.exit(1);
  });
