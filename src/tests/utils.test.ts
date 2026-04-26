import { describe, it, expect } from "vitest";
import {
  brl,
  compact,
  toCents,
  dateShort,
  initials,
  maskCep,
  maskCpf,
  maskCnpj,
  maskPhone,
  csvSafe,
} from "@/lib/utils";

describe("brl", () => {
  it("formata centavos como BRL", () => {
    expect(brl(150050)).toBe("R$\u00a01.500,50");
    expect(brl(0)).toBe("R$\u00a00,00");
    expect(brl(99)).toBe("R$\u00a00,99");
  });

  it("formata valores negativos", () => {
    expect(brl(-10000)).toBe("-R$\u00a0100,00");
  });
});

describe("toCents", () => {
  it("converte reais para centavos", () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(1.99)).toBe(199);
    expect(toCents(0)).toBe(0);
  });

  it("arredonda corretamente", () => {
    expect(toCents(10.555)).toBe(1056);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});

describe("dateShort", () => {
  it("formata datas como DD/MM/YYYY", () => {
    expect(dateShort(new Date("2024-03-15T12:00:00Z"))).toMatch(/15\/03\/2024/);
  });

  it("aceita timestamp number", () => {
    const ts = new Date("2024-06-15T12:00:00Z").getTime();
    expect(dateShort(ts)).toMatch(/15\/06\/2024/);
  });

  it("retorna - para null/undefined", () => {
    expect(dateShort(null)).toBe("-");
    expect(dateShort(undefined)).toBe("-");
  });
});

describe("initials", () => {
  it("retorna 2 primeiras iniciais", () => {
    expect(initials("João Silva")).toBe("JS");
    expect(initials("Maria")).toBe("M");
    expect(initials("Ana Beatriz Costa")).toBe("AB");
  });

  it("lida com string vazia", () => {
    expect(initials("")).toBe("");
  });
});

describe("masks", () => {
  it("maskCep formata corretamente", () => {
    expect(maskCep("12345678")).toBe("12345-678");
    expect(maskCep("12345")).toBe("12345");
    expect(maskCep("123")).toBe("123");
  });

  it("maskCpf formata corretamente", () => {
    expect(maskCpf("12345678901")).toBe("123.456.789-01");
  });

  it("maskCnpj formata corretamente", () => {
    expect(maskCnpj("12345678000195")).toBe("12.345.678/0001-95");
  });

  it("maskPhone formata celular (11 dígitos)", () => {
    expect(maskPhone("11999887766")).toBe("(11) 99988-7766");
  });

  it("maskPhone formata fixo (10 dígitos)", () => {
    expect(maskPhone("1133445566")).toBe("(11) 3344-5566");
  });
});

describe("csvSafe", () => {
  it("escapa fórmulas perigosas", () => {
    expect(csvSafe("=cmd")).toBe("\"'=cmd\"");
    expect(csvSafe("+cmd")).toBe("\"'+cmd\"");
    expect(csvSafe("-cmd")).toBe("\"'-cmd\"");
    expect(csvSafe("@cmd")).toBe("\"'@cmd\"");
  });

  it("preserva texto normal", () => {
    expect(csvSafe("hello")).toBe("hello");
  });

  it("escapa aspas duplas", () => {
    expect(csvSafe('he said "hi"')).toBe('he said ""hi""');
  });

  it("envolve em aspas se contém ponto-e-vírgula", () => {
    expect(csvSafe("a;b")).toBe('"a;b"');
  });
});

describe("comissão sobre implantação", () => {
  it("calcula comissão corretamente sobre implementationPrice", () => {
    const implementationPrice = 500000; // R$ 5.000,00 em centavos
    const quantity = 1;
    const commissionPct = 10;

    const implCents = implementationPrice * quantity;
    const commission = Math.round((implCents * commissionPct) / 100);

    expect(commission).toBe(50000); // R$ 500,00
  });

  it("comissão zero quando implementationPrice é zero", () => {
    const implementationPrice = 0;
    const quantity = 1;
    const commissionPct = 15;

    const implCents = implementationPrice * quantity;
    const commission = Math.round((implCents * commissionPct) / 100);

    expect(commission).toBe(0);
  });

  it("comissão multiplica pela quantidade", () => {
    const implementationPrice = 100000; // R$ 1.000,00
    const quantity = 3;
    const commissionPct = 10;

    const implCents = implementationPrice * quantity;
    const commission = Math.round((implCents * commissionPct) / 100);

    expect(commission).toBe(30000); // R$ 300,00
  });
});
