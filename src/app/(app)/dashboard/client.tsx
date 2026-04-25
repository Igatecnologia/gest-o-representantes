"use client";

import Link from "next/link";
import { MapPin, Receipt, Kanban, ArrowRight, Trophy, Wallet } from "lucide-react";
import { Card, Avatar } from "@/components/ui";
import { StaggerContainer, HoverCard } from "@/components/motion";
import { brl } from "@/lib/utils";
import type { ReactNode } from "react";

/* ============= DASHBOARD SHELL ============= */

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <StaggerContainer className="space-y-0">
      {children}
    </StaggerContainer>
  );
}

/* ============= QUICK ACTIONS ============= */

const ACTIONS = [
  {
    href: "/campo",
    label: "Cadastro em Campo",
    description: "Registrar cliente na rua",
    icon: MapPin,
    color: "text-sky-400",
    glow: "bg-sky-500/15",
    border: "hover:border-sky-500/30",
    shadow: "hover:shadow-[0_0_24px_-4px_rgba(14,165,233,0.2)]",
  },
  {
    href: "/vendas/nova",
    label: "Nova Venda",
    description: "Registrar uma venda",
    icon: Receipt,
    color: "text-emerald-400",
    glow: "bg-emerald-500/15",
    border: "hover:border-emerald-500/30",
    shadow: "hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.2)]",
  },
  {
    href: "/pipeline/novo",
    label: "Novo Negócio",
    description: "Adicionar ao pipeline",
    icon: Kanban,
    color: "text-violet-400",
    glow: "bg-violet-500/15",
    border: "hover:border-violet-500/30",
    shadow: "hover:shadow-[0_0_24px_-4px_rgba(139,92,246,0.2)]",
  },
];

export function QuickActions() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {ACTIONS.map((a) => (
        <Link key={a.href} href={a.href}>
          <HoverCard
            className={`group flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 card-glow transition-all duration-200 ${a.border} ${a.shadow}`}
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] ${a.glow}`}>
              <a.icon className={`h-5 w-5 ${a.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{a.label}</div>
              <div className="text-[11px] text-[var(--color-text-muted)]">{a.description}</div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-dim)] transition-transform duration-200 group-hover:translate-x-0.5" />
          </HoverCard>
        </Link>
      ))}
    </div>
  );
}

/* ============= COMMISSION PROGRESS ============= */

export function CommissionProgress({
  paidThisMonth,
  pending,
}: {
  paidThisMonth: number;
  pending: number;
}) {
  const total = paidThisMonth + pending;
  const paidPct = total > 0 ? (paidThisMonth / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  if (total === 0) return null;

  return (
    <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 card-glow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-amber-500/10">
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <h2 className="text-sm font-semibold">Comissão do mês</h2>
        </div>
        <span className="text-lg font-bold tabular-nums tracking-tight">{brl(total)}</span>
      </div>

      <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        {paidPct > 0 && (
          <div
            className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${paidPct}%` }}
          />
        )}
        {pendingPct > 0 && (
          <div
            className="h-full bg-gradient-to-r from-amber-500/80 to-amber-400/60 transition-all duration-700 ease-out"
            style={{ width: `${pendingPct}%` }}
          />
        )}
      </div>

      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 ring-2 ring-emerald-500/20" />
          <span className="text-[var(--color-text-muted)]">Pago</span>
          <span className="font-semibold tabular-nums text-emerald-400">{brl(paidThisMonth)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-500 to-amber-400 ring-2 ring-amber-500/20" />
          <span className="text-[var(--color-text-muted)]">Pendente</span>
          <span className="font-semibold tabular-nums text-amber-400">{brl(pending)}</span>
        </div>
      </div>
    </div>
  );
}

/* ============= TOP CUSTOMERS ============= */

const MEDALS = [
  { bg: "bg-amber-500/12", text: "text-amber-400", ring: "ring-amber-500/20" },
  { bg: "bg-zinc-400/12", text: "text-zinc-300", ring: "ring-zinc-400/20" },
  { bg: "bg-orange-500/12", text: "text-orange-400", ring: "ring-orange-500/20" },
];

export function TopCustomers({
  customers,
}: {
  customers: { id: string; name: string; total: number }[];
}) {
  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Trophy className="h-4 w-4 text-amber-400" />
        Top clientes do mês
      </h2>
      <ul className="space-y-2">
        {customers.map((c, i) => {
          const medal = MEDALS[i];
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/30 px-3 py-3 transition-colors hover:bg-[var(--color-surface-2)]/60"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ring-1 ${medal?.bg ?? "bg-[var(--color-surface-2)]"} ${medal?.text ?? "text-[var(--color-text-muted)]"} ${medal?.ring ?? "ring-[var(--color-border)]"}`}
              >
                {i + 1}
              </span>
              <Avatar name={c.name} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
              <span className="text-sm font-bold tabular-nums text-[var(--color-text)]">{brl(c.total)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
