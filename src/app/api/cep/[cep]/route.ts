import { NextResponse } from "next/server";
import { fetchCep } from "@/lib/integrations/cep";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ cep: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
