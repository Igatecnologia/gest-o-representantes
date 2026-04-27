/**
 * Migrador idempotente para Turso/SQLite.
 *
 * Lê todos os arquivos .sql em ./drizzle (em ordem alfabética) e executa
 * cada statement. Tolera "already exists" — assim funciona em DBs novos
 * e em DBs que já tem o schema (caso do Turso de produção que recebeu
 * pushes anteriores via drizzle-kit push).
 *
 * Substitui `drizzle-kit push` no build do Vercel, que falha em CI por
 * exigir TTY interativo (promptNamedWithSchemasConflict).
 */
import { createClient } from "@libsql/client";
import * as fs from "node:fs";
import * as path from "node:path";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error("[migrate] DATABASE_URL não configurado — pulando migrações");
  process.exit(0);
}

const client = createClient({ url, authToken });

const drizzleDir = path.join(process.cwd(), "drizzle");

if (!fs.existsSync(drizzleDir)) {
  console.log("[migrate] pasta drizzle/ não existe — nada para migrar");
  process.exit(0);
}

const files = fs
  .readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("[migrate] nenhum arquivo .sql encontrado");
  process.exit(0);
}

async function run() {
  let totalApplied = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const sql = fs.readFileSync(path.join(drizzleDir, file), "utf-8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
        totalApplied++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Idempotência: tabelas/índices já existentes não são erro.
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate column name")
        ) {
          totalSkipped++;
          continue;
        }
        console.error(`[migrate] FALHA em ${file}:`);
        console.error(`  statement: ${stmt.slice(0, 200)}…`);
        console.error(`  erro: ${msg}`);
        throw err;
      }
    }
  }

  console.log(
    `[migrate] ✓ ${files.length} arquivo(s) processado(s) — ${totalApplied} aplicado(s), ${totalSkipped} já existente(s)`,
  );
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
