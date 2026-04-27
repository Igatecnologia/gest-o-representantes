"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { Lock, Mail, Shield } from "lucide-react";

const initialState: { error?: string } = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="relative flex min-h-screen bg-[var(--color-bg)] overflow-hidden">
      {/* Mobile background animation */}
      <div className="absolute inset-0 bg-gradient-pan opacity-30 lg:hidden" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-bg)]/80 to-[var(--color-bg)] lg:hidden" />

      {/* LEFT: Brand panel */}
      <div className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-pan" />
        <div className="absolute inset-0 bg-noise" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg)]/30 via-transparent to-[var(--color-bg)]/70" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo-iga.png"
              alt="IGA"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-contain"
            />
            <div>
              <span className="font-bold text-white text-lg">IGA</span>
              <span className="ml-2 text-xs text-white/40 font-medium">Automação & Tecnologia</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-10">
          <h2 className="mb-4 text-5xl font-bold tracking-tight text-white leading-[1.1]">
            Gestão comercial
            <br />
            <span className="text-white/60">simplificada.</span>
          </h2>
          <p className="max-w-md text-base text-white/50 leading-relaxed">
            Controle seus clientes, propostas, vendas e comissões
            em um só lugar — do primeiro contato ao fechamento.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 p-10 text-xs text-white/30">
          <Shield className="h-3 w-3" />
          © {new Date().getFullYear()} IGA · Gestão de Representantes
        </div>
      </div>

      {/* RIGHT: Login form */}
      <div className="relative z-10 flex w-full items-center justify-center px-4 py-8 md:px-6 md:py-12 lg:w-[500px]">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-3">
              <img
                src="/logo-iga.png"
                alt="IGA"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl object-contain"
              />
              <span className="font-bold tracking-tight text-lg">IGA</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
              Use sua conta interna para acessar o painel.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  className="h-12 pl-10 text-base"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 pl-10 text-base"
                />
              </div>
            </div>

            {state.error && (
              <p className="rounded-[var(--radius)] border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/8 px-4 py-3 text-sm text-[var(--color-danger)]">
                {state.error}
              </p>
            )}

            <Button type="submit" size="lg" className="h-12 w-full text-base shadow-sm" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

        </div>
      </div>
    </main>
  );
}

