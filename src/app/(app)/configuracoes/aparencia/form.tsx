"use client";

import { Card } from "@/components/ui";
import { DensityToggle } from "@/components/density-toggle";
import {
  useCustomerCardFields,
  useDealCardFields,
  type CustomerCardField,
  type DealCardField,
} from "@/lib/use-card-fields";
import { Building2, Kanban, Settings2, Maximize2, Sparkles } from "lucide-react";

const CUSTOMER_FIELD_OPTIONS: { id: CustomerCardField; label: string; hint: string }[] = [
  { id: "phone", label: "Telefone", hint: "Mostra o celular abaixo do nome" },
  { id: "city", label: "Cidade/UF", hint: "Localização do cliente" },
  { id: "document", label: "CNPJ/CPF", hint: "Documento" },
  { id: "rep", label: "Representante", hint: "Quem é o dono do cliente (admin)" },
  { id: "email", label: "E-mail", hint: "E-mail de contato" },
];

const DEAL_FIELD_OPTIONS: { id: DealCardField; label: string; hint: string }[] = [
  { id: "expectedDate", label: "Data prevista", hint: "Quando o negócio deve fechar" },
  { id: "rep", label: "Representante", hint: "Avatar e nome do dono" },
  { id: "daysInStage", label: "Dias parado", hint: "Há quantos dias está nessa stage" },
  { id: "probability", label: "Probabilidade", hint: "% de chance de fechar" },
];

export function AppearanceForm() {
  const [customerFields, setCustomerFields] = useCustomerCardFields();
  const [dealFields, setDealFields] = useDealCardFields();

  function toggleCustomer(field: CustomerCardField) {
    const next = new Set(customerFields);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    setCustomerFields(Array.from(next));
  }

  function toggleDeal(field: DealCardField) {
    const next = new Set(dealFields);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    setDealFields(Array.from(next));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Densidade */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Maximize2 className="h-4 w-4 text-[var(--color-primary)]" />
          Densidade da interface
        </h2>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          Compacto cabe mais informação na tela; espaçoso facilita leitura e
          toques no mobile.
        </p>
        <DensityToggle />
      </Card>

      {/* Cards de cliente */}
      <Card>
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Building2 className="h-4 w-4 text-[var(--color-primary)]" />
          Cards de cliente
        </h2>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          Escolha quais informações aparecem nos cards de cliente (mobile e
          tabela). Salvo só no seu navegador.
        </p>
        <div className="space-y-2">
          {CUSTOMER_FIELD_OPTIONS.map((opt) => {
            const checked = customerFields.has(opt.id);
            return (
              <label
                key={opt.id}
                className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]/40"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCustomer(opt.id)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {opt.hint}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Cards de pipeline */}
      <Card>
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Kanban className="h-4 w-4 text-[var(--color-primary)]" />
          Cards do pipeline
        </h2>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          Quais campos extras aparecem em cada card de negócio.
        </p>
        <div className="space-y-2">
          {DEAL_FIELD_OPTIONS.map((opt) => {
            const checked = dealFields.has(opt.id);
            return (
              <label
                key={opt.id}
                className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]/40"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDeal(opt.id)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {opt.hint}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-3 py-2 text-xs text-[var(--color-text-muted)]">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
        <div>
          As preferências são salvas no seu navegador. Se você logar em outro
          dispositivo, vão aparecer com os defaults.
        </div>
      </div>
    </div>
  );
}
