import { NextResponse } from "next/server";
import { fetchCnpj } from "@/lib/integrations/cnpj";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ cnpj: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blocked } = await checkRateLimit(`cnpj:${session.sub}`, {
    maxAttempts: 15,
    windowMs: 60_000,
  });
  if (blocked) {
    return NextResponse.json({ error: "Muitas requisições. Aguarde." }, { status: 429 });
  }

  const { cnpj } = await ctx.params;
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }
  const result = await fetchCnpj(cleaned);
  if (!result) {
    return NextResponse.json({ error: "CNPJ inválido ou não encontrado" }, { status: 404 });
  }
  return NextResponse.json(result);
}
