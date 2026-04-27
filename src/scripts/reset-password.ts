/**
 * Reset password de um usuário no banco local (data.db).
 * Uso:
 *   tsx --env-file=.env.local src/scripts/reset-password.ts <email> <nova-senha>
 *
 * IMPORTANTE: NUNCA usar contra Turso de produção. Só para desenvolvimento.
 */
import { hash } from "bcrypt-ts";
import { createClient } from "@libsql/client";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Uso: tsx src/scripts/reset-password.ts <email> <nova-senha>");
  process.exit(1);
}

const url = process.env.DATABASE_URL ?? "file:./data.db";
if (!url.startsWith("file:")) {
  console.error("BLOQUEADO: este script só funciona em DB local (file:).");
  console.error("Detectado URL: " + url);
  process.exit(1);
}

async function run() {
  const client = createClient({ url });
  const passwordHash = await hash(password, 10);
  const r = await client.execute({
    sql: "UPDATE users SET password_hash = ? WHERE email = ?",
    args: [passwordHash, email],
  });
  if (r.rowsAffected === 0) {
    console.error(`Nenhum usuário encontrado com email ${email}.`);
    process.exit(1);
  }
  console.log(`Senha de ${email} atualizada com sucesso.`);
  console.log(`   Login:  ${email}`);
  console.log(`   Senha:  ${password}`);
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
