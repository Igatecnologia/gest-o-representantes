import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "file:./data.db";

async function run() {
  const client = createClient({ url });
  const r = await client.execute(
    "SELECT email, name, role, active FROM users ORDER BY created_at",
  );
  console.log("Usuários no banco local:");
  console.log("");
  for (const row of r.rows) {
    const active = row.active ? "ATIVO" : "INATIVO";
    console.log(`  ${row.email}  |  ${row.role}  |  ${active}  |  ${row.name}`);
  }
  console.log(`\nTotal: ${r.rows.length} usuário(s).`);
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
