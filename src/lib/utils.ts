import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata centavos como BRL (ex: 150050 → "R$ 1.500,50") */
export function brl(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/** Formata centavos em notação compacta (ex: 150000 → "1,5 mil") */
export function compact(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

/** Converte reais (float) para centavos (integer) */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function dateShort(d: Date | number | null | undefined): string {
  if (!d) return "-";
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function dateLong(d: Date | number | null | undefined): string {
  if (!d) return "-";
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function maskCep(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskCpf(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function maskCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/**
 * Constrói URL do WhatsApp web/app com mensagem pré-pronta.
 * Aceita telefone com ou sem máscara; força DDI 55 (Brasil) se for nacional.
 */
export function whatsappUrl(phone: string | null | undefined, message: string): string {
  const cleaned = (phone ?? "").replace(/\D/g, "");
  const withCountry =
    cleaned.length >= 10 && !cleaned.startsWith("55") ? `55${cleaned}` : cleaned;
  const text = encodeURIComponent(message);
  return withCountry ? `https://wa.me/${withCountry}?text=${text}` : `https://wa.me/?text=${text}`;
}

/** Escapa campo CSV contra formula injection (=, +, -, @, \t, \r) */
export function csvSafe(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(escaped)) {
    return `"'${escaped}"`;
  }
  return escaped.includes(";") ? `"${escaped}"` : escaped;
}
