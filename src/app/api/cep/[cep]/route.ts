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
  const result = await fetchCep(cep);
  if (!result) {
    return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
  }
  return NextResponse.json(result);
}
