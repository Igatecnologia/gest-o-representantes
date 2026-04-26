"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { maskCep, maskCnpj, maskCpf, maskPhone } from "@/lib/utils";
import { useUnsavedWarning } from "@/lib/use-unsaved-warning";
import { Check, Loader2, MapPin, Search, Sparkles } from "lucide-react";
import type { Customer } from "@/lib/db/schema";

type ActionResult = { error?: string } | undefined;
type ActionFn = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

const UF = [
  "", "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

type PersonType = "pj" | "pf";

type FormState = {
  personType: PersonType;
  name: string;
  tradeName: string;
  document: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  notes: string;
};

function detectPersonType(doc?: string | null): PersonType {
  if (!doc) return "pj";
  const digits = doc.replace(/\D/g, "");
  return digits.length <= 11 ? "pf" : "pj";
}

function fromCustomer(c?: Customer): FormState {
  const pt = detectPersonType(c?.document);
  return {
    personType: pt,
    name: c?.name ?? "",
    tradeName: c?.tradeName ?? "",
    document: c?.document
      ? pt === "pf" ? maskCpf(c.document) : maskCnpj(c.document)
      : "",
    email: c?.email ?? "",
    phone: c?.phone ? maskPhone(c.phone) : "",
    cep: c?.cep ? maskCep(c.cep) : "",
    street: c?.street ?? "",
    number: c?.number ?? "",
    complement: c?.complement ?? "",
    district: c?.district ?? "",
    city: c?.city ?? "",
    state: c?.state ?? "",
    notes: c?.notes ?? "",
  };
}

export function CustomerForm({
  action,
  initial,
  submitLabel,
}: {
  action: ActionFn;
  initial?: Customer;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    undefined
  );
  const [f, setF] = useState<FormState>(fromCustomer(initial));
  const [dirty, setDirty] = useState(false);
  const [loadingCnpj, startCnpj] = useTransition();
  const [loadingCep, startCep] = useTransition();
  const [cnpjOk, setCnpjOk] = useState(Boolean(initial?.document));
  const [cepOk, setCepOk] = useState(Boolean(initial?.cep));
  useUnsavedWarning(dirty && !pending);

  const isPJ = f.personType === "pj";

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setDirty(true);
    setF((prev) => ({ ...prev, [k]: v }));
  };

  const switchPersonType = (pt: PersonType) => {
    setF((prev) => ({
      ...prev,
      personType: pt,
      document: "",
      tradeName: pt === "pf" ? "" : prev.tradeName,
    }));
    setCnpjOk(false);
  };

  const lookupCnpj = () => {
    const digits = f.document.replace(/\D/g, "");
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }
    startCnpj(async () => {
      try {
        const res = await fetch(`/api/cnpj/${digits}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.error ?? "CNPJ não encontrado");
          setCnpjOk(false);
          return;
        }
        const data = await res.json();
        setF((p) => ({
          ...p,
          name: data.name ?? p.name,
          tradeName: data.tradeName ?? p.tradeName,
          email: data.email ?? p.email,
          phone: data.phone ? maskPhone(data.phone) : p.phone,
          cep: data.cep ? maskCep(data.cep) : p.cep,
          street: data.street ?? p.street,
          number: data.number ?? p.number,
          complement: data.complement ?? p.complement,
          district: data.district ?? p.district,
          city: data.city ?? p.city,
          state: data.state ?? p.state,
        }));
        setCnpjOk(true);
        setCepOk(Boolean(data.cep));
        toast.success(`Dados preenchidos da Receita (${data.status ?? "ok"})`);
      } catch {
        toast.error("Falha ao consultar CNPJ");
        setCnpjOk(false);
      }
    });
  };

  const lookupCep = () => {
    const digits = f.cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }
    startCep(async () => {
      try {
        const res = await fetch(`/api/cep/${digits}`);
        if (!res.ok) {
          toast.error("CEP não encontrado");
          setCepOk(false);
          return;
        }
        const data = await res.json();
        setF((p) => ({
          ...p,
          street: data.street || p.street,
          district: data.district || p.district,
          city: data.city || p.city,
          state: data.state || p.state,
        }));
        setCepOk(true);
        toast.success("Endereço preenchido automaticamente");
      } catch {
        toast.error("Falha ao consultar CEP");
      }
    });
  };

  return (
    <Card className="max-w-3xl">
      <form action={formAction} className="space-y-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-brand-subtle border border-[var(--color-border)]">
              <Sparkles className="h-3 w-3 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-sm font-semibold">Identificação</h3>
          </div>

          {/* Seletor PF / PJ */}
          <div className="mb-4 flex rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-1">
            <button
              type="button"
              onClick={() => switchPersonType("pj")}
              className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-all ${
                isPJ
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Pessoa Jurídica
            </button>
            <button
              type="button"
              onClick={() => switchPersonType("pf")}
              className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-all ${
                !isPJ
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Pessoa Física
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Documento */}
            <div className="md:col-span-2">
              <Label htmlFor="document">{isPJ ? "CNPJ" : "CPF"}</Label>
              <div className="flex gap-2">
                <Input
                  id="document"
                  name="document"
                  placeholder={isPJ ? "00.000.000/0000-00" : "000.000.000-00"}
                  value={f.document}
                  onChange={(e) => {
                    set("document", isPJ ? maskCnpj(e.target.value) : maskCpf(e.target.value));
                    setCnpjOk(false);
                  }}
                  className="font-mono"
                />
                {isPJ && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={lookupCnpj}
                    disabled={loadingCnpj}
                  >
                    {loadingCnpj ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : cnpjOk ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="name">{isPJ ? "Razão social *" : "Nome completo *"}</Label>
              <Input
                id="name"
                name="name"
                required
                value={f.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            {isPJ && (
              <div>
                <Label htmlFor="tradeName">Nome fantasia</Label>
                <Input
                  id="tradeName"
                  name="tradeName"
                  value={f.tradeName}
                  onChange={(e) => set("tradeName", e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="(11) 00000-0000"
                value={f.phone}
                onChange={(e) => set("phone", maskPhone(e.target.value))}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-brand-subtle border border-[var(--color-border)]">
              <MapPin className="h-3 w-3 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-sm font-semibold">Endereço</h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              (Preencha o CEP para completar automaticamente)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label htmlFor="cep">CEP</Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  name="cep"
                  placeholder="00000-000"
                  value={f.cep}
                  onChange={(e) => {
                    const v = maskCep(e.target.value);
                    set("cep", v);
                    setCepOk(false);
                    if (v.replace(/\D/g, "").length === 8) {
                      setTimeout(lookupCep, 100);
                    }
                  }}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={lookupCep}
                  disabled={loadingCep}
                  className="shrink-0"
                >
                  {loadingCep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : cepOk ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="street">Rua / Logradouro</Label>
              <Input
                id="street"
                name="street"
                value={f.street}
                onChange={(e) => set("street", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                name="number"
                value={f.number}
                onChange={(e) => set("number", e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                name="complement"
                value={f.complement}
                onChange={(e) => set("complement", e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="district">Bairro</Label>
              <Input
                id="district"
                name="district"
                value={f.district}
                onChange={(e) => set("district", e.target.value)}
              />
            </div>

            <div className="md:col-span-4">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={f.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="state">UF</Label>
              <Select
                id="state"
                name="state"
                value={f.state}
                onChange={(e) => set("state", e.target.value)}
              >
                {UF.map((u) => (
                  <option key={u} value={u}>
                    {u || "—"}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        <section>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </section>

        {state?.error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {state.error}
          </p>
        )}

        <div className="flex gap-2 border-t border-[var(--color-border)] pt-5">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
