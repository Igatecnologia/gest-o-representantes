"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { Lock, Mail, Sparkles, TrendingUp, Users, Zap, Shield } from "lucide-react";

const initialState: { error?: string } = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="relative flex min-h-screen bg-[var(--color-bg)]">
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
            Vendas com
            <br />
            <span className="text-white/60">clareza total.</span>
          </h2>
          <p className="mb-12 max-w-md text-base text-white/50 leading-relaxed">
            Pipeline, comissões e representantes numa plataforma
            unificada — feita para equipes comerciais que precisam de resultados.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-lg">
            <Feature icon={Zap} label="Propostas em minutos" />
            <Feature icon={TrendingUp} label="Dashboard em tempo real" />
            <Feature icon={Users} label="Ranking por rep" />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 p-10 text-xs text-white/30">
          <Shield className="h-3 w-3" />
          © {new Date().getFullYear()} IGA · Gestão de Representantes
        </div>
      </div>

      {/* RIGHT: Login form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[500px]">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-3">
              <Image
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
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-1 text-[11px] text-[var(--color-text-muted)] backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-[var(--color-primary)]" />
              Entrar na plataforma
            </div>
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
                  className="h-12 pl-10 text-[15px]"
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
                  className="h-12 pl-10 text-[15px]"
                />
              </div>
            </div>

            {state.error && (
              <p className="rounded-[var(--radius)] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                {state.error}
              </p>
            )}

            <Button type="submit" size="lg" className="h-12 w-full text-[15px] shadow-[0_0_20px_rgba(46,109,180,0.3)]" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

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
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xl transition-colors hover:bg-white/8 hover:border-white/15">
      <Icon className="mb-2.5 h-4 w-4 text-white/70" />
      <div className="text-[11px] font-medium leading-snug text-white/70">{label}</div>
    </div>
  );
}
