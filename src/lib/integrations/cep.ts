export type CepResult = {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
};

/**
 * Busca endereço por CEP.
 * Fonte principal: BrasilAPI (sem rate limit agressivo).
 * Fallback: ViaCEP.
 */
export async function fetchCep(rawCep: string): Promise<CepResult | null> {
  const cep = rawCep.replace(/\D/g, "");
  if (cep.length !== 8) return null;

  // 1. BrasilAPI v2
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
      headers: {
        "User-Agent": "SalesOps/1.0 (+internal)",
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 * 7 }, // cache 7 dias
    });
    if (res.ok) {
      const data = (await res.json()) as {
        cep: string;
        state: string;
        city: string;
        neighborhood: string;
        street: string;
      };
      return {
        cep: data.cep,
        state: data.state,
        city: data.city,
        district: data.neighborhood ?? "",
        street: data.street ?? "",
      };
    }
  } catch {
    // segue pro fallback
  }

  // 2. Fallback ViaCEP
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: {
        "User-Agent": "SalesOps/1.0 (+internal)",
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        cep: string;
        logradouro: string;
        bairro: string;
        localidade: string;
        uf: string;
        erro?: boolean;
      };
      if (data.erro) return null;
      return {
        cep: data.cep,
        state: data.uf,
        city: data.localidade,
        district: data.bairro,
        street: data.logradouro,
      };
    }
  } catch {
    return null;
  }

  return null;
}
