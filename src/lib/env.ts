import { z } from "zod";

const envSchema = z.object({
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET deve ter no mínimo 32 caracteres. Gere com: openssl rand -base64 32"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL é obrigatório (ex: file:./data.db ou libsql://...)"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  // Push notifications (VAPID) — opcional; se ausente, push é desabilitado
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${errors}`);
  }
  return result.data;
}

export const env = validateEnv();
