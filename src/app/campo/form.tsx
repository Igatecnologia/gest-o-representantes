"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createFieldCustomerAction } from "@/lib/actions/field";
import { maskCep, maskCnpj, maskCpf, maskPhone } from "@/lib/utils";
import {
  Building2,
  Check,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { ScaleSpring, FadeUp } from "@/components/motion";

const initial: { error?: string; ok?: boolean } = {};

type PersonType = "pj" | "pf";

type Form = {
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
  latitude: string;
  longitude: string;
  notes: string;
};

const empty: Form = {
  personType: "pj",
  name: "",
  tradeName: "",
  document: "",
  email: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
  notes: "",
};

export function FieldForm() {
  const [state, action, pending] = useActionState(createFieldCustomerAction, initial);
  const [f, setF] = useState<Form>(empty);
  const [loadingCnpj, startCnpj] = useTransition();
  const [loadingCep, startCep] = useTransition();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsOk, setGpsOk] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const restored = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("iga-campo-draft");
      if (saved) {
        const parsed = JSON.parse(saved) as Form;
        if (parsed.name || parsed.document || parsed.phone) {
          setF(parsed);
          restored.current = true;
          toast.info("Rascunho restaurado");
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-save draft (debounced 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (f.name || f.document || f.phone) {
        localStorage.setItem("iga-campo-draft", JSON.stringify(f));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [f]);

  useEffect(() => {
    if (state.ok) {
      localStorage.removeItem("iga-campo-draft");
      setSuccess(true);
      toast.success("Cliente cadastrado em campo!");
    }
  }, [state]);

  const grabLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Dispositivo sem GPS");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setF((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGpsOk(true);
        setGpsLoading(false);
        toast.success("Localização capturada");
      },
      (err) => {
        setGpsLoading(false);
        toast.error("Falha ao pegar GPS: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const lookupCnpj = () => {
    const digits = f.document.replace(/\D/g, "");
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }
    startCnpj(async () => {
      const res = await fetch(`/api/cnpj/${digits}`);
      if (!res.ok) {
        toast.error("CNPJ não encontrado");
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
        district: data.district ?? p.district,
        city: data.city ?? p.city,
        state: data.state ?? p.state,
      }));
      toast.success("Dados da Receita preenchidos");
    });
  };

  const lookupCep = () => {
    const digits = f.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    startCep(async () => {
      const res = await fetch(`/api/cep/${digits}`);
      if (!res.ok) return;
      const data = await res.json();
      setF((p) => ({
        ...p,
        street: data.street || p.street,
        district: data.district || p.district,
        city: data.city || p.city,
        state: data.state || p.state,
      }));
      toast.success("Endereço preenchido");
    });
  };

  if (success) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <ScaleSpring>
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand shadow-lg">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
        </ScaleSpring>
        <FadeUp delay={0.15}>
          <h1 className="mb-2 text-2xl font-semibold">Cliente cadastrado!</h1>
          <p className="mb-8 text-sm text-[var(--color-text-muted)]">
            Os dados foram enviados com sucesso.
          </p>
        </FadeUp>
        <FadeUp delay={0.3} className="flex w-full flex-col gap-2">
          <button
            onClick={() => {
              localStorage.removeItem("iga-campo-draft");
              setF(empty);
              setSuccess(false);
              setGpsOk(false);
            }}
            className="w-full rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-3.5 font-medium text-white active:scale-[0.98]"
          >
            Cadastrar outro cliente
          </button>
          <Link
            href="/dashboard"
            className="w-full rounded-[var(--radius)] border border-[var(--color-border)] px-5 py-3.5 text-center text-sm text-[var(--color-text-muted)]"
          >
            Voltar ao painel
          </Link>
        </FadeUp>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-32">
      {/* Header mobile */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-4 py-3 backdrop-blur-xl">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
            Cadastro em campo
          </div>
          <div className="font-semibold">Novo cliente</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-brand shadow-sm">
          <Building2 className="h-4 w-4 text-white" />
        </div>
      </header>

      <form action={action} className="space-y-6 p-4">
        {/* GPS */}
        <button
          type="button"
          onClick={grabLocation}
          disabled={gpsLoading}
          className={`flex w-full items-center justify-between rounded-[var(--radius)] border px-4 py-3 text-left transition ${
            gpsOk
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                gpsOk ? "bg-emerald-500/20" : "bg-[var(--color-surface-2)]"
              }`}
            >
              {gpsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : gpsOk ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium">
                {gpsOk ? "Localização capturada" : "Capturar GPS"}
              </div>
              {gpsOk ? (
                <div className="font-mono text-[10px] text-[var(--color-text-muted)]">
                  {f.latitude}, {f.longitude}
                </div>
              ) : (
                <div className="text-xs text-[var(--color-text-muted)]">
                  Toque para registrar o local da visita
                </div>
              )}
            </div>
          </div>
        </button>

        <input type="hidden" name="latitude" value={f.latitude} />
        <input type="hidden" name="longitude" value={f.longitude} />

        {/* Identificação */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Identificação
            </h3>
          </div>

          {/* Seletor PF / PJ */}
          <div className="flex rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-1">
            <button
              type="button"
              onClick={() => setF((p) => ({ ...p, personType: "pj", document: "", tradeName: "" }))}
              className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium transition-all ${
                f.personType === "pj"
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              Pessoa Jurídica
            </button>
            <button
              type="button"
              onClick={() => setF((p) => ({ ...p, personType: "pf", document: "", tradeName: "" }))}
              className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium transition-all ${
                f.personType === "pf"
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              Pessoa Física
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">
              {f.personType === "pj" ? "CNPJ" : "CPF"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="document"
                inputMode="numeric"
                placeholder={f.personType === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                value={f.document}
                onChange={(e) => set("document", f.personType === "pj" ? maskCnpj(e.target.value) : maskCpf(e.target.value))}
                className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-base"
              />
              {f.personType === "pj" && (
                <button
                  type="button"
                  onClick={lookupCnpj}
                  disabled={loadingCnpj}
                  className="flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[var(--color-primary)] text-white disabled:opacity-50 active:scale-95"
                >
                  {loadingCnpj ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          <MobileField
            label={f.personType === "pj" ? "Razão social *" : "Nome completo *"}
            name="name"
            value={f.name}
            onChange={(v) => set("name", v)}
            required
          />
          {f.personType === "pj" && (
            <MobileField
              label="Nome fantasia"
              name="tradeName"
              value={f.tradeName}
              onChange={(v) => set("tradeName", v)}
            />
          )}
          <MobileField
            label="Telefone"
            name="phone"
            value={f.phone}
            onChange={(v) => set("phone", maskPhone(v))}
            type="tel"
            placeholder="(11) 00000-0000"
          />
          <MobileField
            label="E-mail"
            name="email"
            value={f.email}
            onChange={(v) => set("email", v)}
            type="email"
          />
        </section>

        {/* Endereço */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Endereço
            </h3>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">CEP</label>
            <div className="flex gap-2">
              <input
                name="cep"
                inputMode="numeric"
                placeholder="00000-000"
                value={f.cep}
                onChange={(e) => {
                  const v = maskCep(e.target.value);
                  set("cep", v);
                  if (v.replace(/\D/g, "").length === 8) setTimeout(lookupCep, 100);
                }}
                className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-base"
              />
              {loadingCep && (
                <div className="flex h-12 w-12 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
                </div>
              )}
            </div>
          </div>

          <MobileField
            label="Rua"
            name="street"
            value={f.street}
            onChange={(v) => set("street", v)}
          />
          <div className="grid grid-cols-3 gap-2">
            <MobileField
              label="Nº"
              name="number"
              value={f.number}
              onChange={(v) => set("number", v)}
            />
            <div className="col-span-2">
              <MobileField
                label="Complemento"
                name="complement"
                value={f.complement}
                onChange={(v) => set("complement", v)}
              />
            </div>
          </div>
          <MobileField
            label="Bairro"
            name="district"
            value={f.district}
            onChange={(v) => set("district", v)}
          />
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <MobileField
                label="Cidade"
                name="city"
                value={f.city}
                onChange={(v) => set("city", v)}
              />
            </div>
            <MobileField
              label="UF"
              name="state"
              value={f.state}
              onChange={(v) => set("state", v.toUpperCase().slice(0, 2))}
              maxLength={2}
            />
          </div>
        </section>

        {/* Observações */}
        <section>
          <label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">
            Observações da visita
          </label>
          <textarea
            name="notes"
            rows={3}
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Interesse, produtos, próximos passos..."
            className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base"
          />
        </section>

        {state.error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {state.error}
          </p>
        )}
      </form>

      {/* Submit fixo no rodapé */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-bg)]/90 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <button
            type="submit"
            form=""
            onClick={(e) => {
              // dispara submit do form pai
              const form = document.querySelector("form");
              form?.requestSubmit();
            }}
            disabled={pending}
            className="w-full rounded-[var(--radius)] bg-gradient-brand px-5 py-4 text-base font-semibold text-white shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? "Enviando..." : "Cadastrar cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/25"
      />
    </div>
  );
}
