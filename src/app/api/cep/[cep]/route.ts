import { NextResponse } from "next/server";
import { fetchCep } from "@/lib/integrations/cep";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ cep: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blocked } = await checkRateLimit(`cep:${session.sub}`, {
    maxAttempts: 30,
    windowMs: 60_000,
  });
  if (blocked) {
    return NextResponse.json({ error: "Muitas requisições. Aguarde." }, { status: 429 });
  }

  const { cep } = await ctx.params;
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }
  const result = await fetchCep(cleaned);
  if (!result) {
    return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
  }
  return NextResponse.json(result);
}
