export type CnpjResult = {
  cnpj: string;
  name: string; // razão social
  tradeName: string; // nome fantasia
  email: string | null;
  phone: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  status: string; // situação cadastral
  mainActivity: string | null;
};

/**
 * Valida dígitos verificadores do CNPJ.
 */
export function isValidCnpj(raw: string): boolean {
  const cnpj = raw.replace(/\D/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calc = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(base[i], 10) * weights[i];
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calc(cnpj.slice(0, 12), w1);
  const d2 = calc(cnpj.slice(0, 12) + d1, w2);

  return cnpj.endsWith(`${d1}${d2}`);
}

/**
 * Consulta dados cadastrais de CNPJ.
 * Fonte: BrasilAPI (com cache público).
 */
export async function fetchCnpj(rawCnpj: string): Promise<CnpjResult | null> {
  const cnpj = rawCnpj.replace(/\D/g, "");
  if (!isValidCnpj(cnpj)) return null;

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: {
        "User-Agent": "SalesOps/1.0 (+internal)",
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 }, // cache 24h
    });
    if (!res.ok) return null;

    const d = (await res.json()) as {
      cnpj: string;
      razao_social: string;
      nome_fantasia: string;
      email: string | null;
      ddd_telefone_1: string | null;
      cep: string | null;
      logradouro: string | null;
      numero: string | null;
      complemento: string | null;
      bairro: string | null;
      municipio: string | null;
      uf: string | null;
      descricao_situacao_cadastral: string;
      cnae_fiscal_descricao: string | null;
    };

    return {
      cnpj: d.cnpj,
      name: d.razao_social,
      tradeName: d.nome_fantasia ?? d.razao_social,
      email: d.email,
      phone: d.ddd_telefone_1,
      cep: d.cep,
      street: d.logradouro,
      number: d.numero,
      complement: d.complemento,
      district: d.bairro,
      city: d.municipio,
      state: d.uf,
      status: d.descricao_situacao_cadastral,
      mainActivity: d.cnae_fiscal_descricao,
    };
  } catch {
    return null;
  }
}
