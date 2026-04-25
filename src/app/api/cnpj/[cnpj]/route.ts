import { NextResponse } from "next/server";
import { fetchCnpj } from "@/lib/integrations/cnpj";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ cnpj: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
