"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { Lock, Mail, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

const initialState: { error?: string } = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="relative flex min-h-screen bg-[var(--color-bg)]">
      {/* LEFT: Brand panel */}
      <div className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-pan" />
        <div className="absolute inset-0 bg-noise" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg)]/20 via-transparent to-[var(--color-bg)]/60" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
              <span className="font-bold text-white">S</span>
            </div>
            <span className="font-semibold text-white text-lg">SalesOps</span>
          </div>
        </div>

        <div className="relative z-10 p-10">
          <h2 className="mb-3 text-4xl font-semibold tracking-tight text-white">
            Vendas com clareza.
            <br />
            <span className="opacity-70">Comissão com confiança.</span>
          </h2>
          <p className="mb-10 max-w-md text-white/70">
            Pipeline, metas, comissões e representantes numa única plataforma —
            feita para times comerciais de software.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <Feature icon={Zap} label="Propostas em minutos" />
            <Feature icon={TrendingUp} label="Dashboard em tempo real" />
            <Feature icon={Users} label="Ranking por rep" />
          </div>
        </div>

        <div className="relative z-10 p-10 text-xs text-white/50">
          © {new Date().getFullYear()} SalesOps · Uso interno
        </div>
      </div>

      {/* RIGHT: Login form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[480px]">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-brand">
                <span className="font-bold text-white text-sm">S</span>
              </div>
              <span className="font-semibold tracking-tight">SalesOps</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[11px] text-[var(--color-text-muted)]">
              <Sparkles className="h-3 w-3 text-[var(--color-primary)]" />
              Entrar na plataforma
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
              Use sua conta interna para acessar o painel.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  defaultValue="redacted@example.com"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            {state.error && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {state.error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-8 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-center text-xs text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-text)]">Usuário demo:</span>{" "}
            redacted@example.com / REDACTED
          </p>
        </div>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-md">
      <Icon className="mb-2 h-4 w-4 text-white/80" />
      <div className="text-xs leading-tight text-white/80">{label}</div>
    </div>
  );
}
