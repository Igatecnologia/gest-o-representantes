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
  const result = await fetchCnpj(cnpj);
  if (!result) {
    return NextResponse.json({ error: "CNPJ inválido ou não encontrado" }, { status: 404 });
  }
  return NextResponse.json(result);
}
