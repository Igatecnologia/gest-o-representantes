"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Receipt,
  Wallet,
  Kanban,
  FileText,
  Settings,
  MapPin,
  LogOut,
  CalendarClock,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/representantes", label: "REPRESENTANTES", icon: Users, adminOnly: true },
  { href: "/clientes", label: "CLIENTES", icon: Building2 },
  { href: "/produtos", label: "PRODUTOS", icon: Package, adminOnly: true },
  { href: "/pipeline", label: "PIPELINE", icon: Kanban },
  { href: "/propostas", label: "PROPOSTAS", icon: FileText },
  { href: "/retornos", label: "RETORNOS", icon: CalendarClock },
  { href: "/vendas", label: "VENDAS", icon: Receipt },
  { href: "/comissoes", label: "COMISSÕES", icon: Wallet },
  { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/clientes/mapa", label: "MAPA", icon: MapPin },
  { href: "/campo", label: "CAMPO", icon: MapPin },
  { href: "/configuracoes", label: "CONFIGURAÇÕES", icon: Settings },
];

// Tab bar mobile: 4 tabs regulares + botão CTA central /campo (raised, gradiente)
const MOBILE_TABS_LEFT: NavItem[] = [
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/retornos", label: "Retornos", icon: CalendarClock },
];
const MOBILE_TABS_RIGHT: NavItem[] = [
  { href: "/propostas", label: "Propostas", icon: FileText },
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
];

export function Sidebar({
  userName,
  role,
  followUpCount = 0,
}: {
  userName: string;
  role: "admin" | "manager" | "rep";
  followUpCount?: number;
}) {
  const pathname = usePathname();
  const isAdmin = role === "admin" || role === "manager";
  const items = NAV.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop sidebar — estilo clean/corporativo */}
      <aside
        aria-label="Menu principal"
        className="sticky top-0 hidden h-screen w-[200px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex"
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-[var(--color-border)] px-5">
          <img
            src="/logo-iga.png"
            alt="IGA"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded object-contain"
          />
          <div>
            <span className="text-sm font-bold tracking-tight text-[var(--color-text)]">IGA</span>
            <span className="ml-1 text-[10px] text-[var(--color-text-dim)]">Representantes</span>
          </div>
        </div>

        {/* Nav */}
        <nav aria-label="Navegação principal" className="flex-1 py-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-5 py-2.5 text-[12px] font-semibold tracking-wide transition-colors",
                  active
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text)] border-l-[3px] border-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] border-l-[3px] border-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "text-[var(--color-primary)]" : ""
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/retornos" && followUpCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-bold text-white">
                    {followUpCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-[var(--color-text)] truncate">
                {userName}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                {isAdmin ? "Administrador" : "Representante"}
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Sair do sistema"
                className="rounded-[var(--radius-sm)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile tab bar — 2 tabs | CTA central (Campo) | 2 tabs */}
      <nav
        aria-label="Navegação mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="relative flex items-stretch">
          {MOBILE_TABS_LEFT.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium",
                  active
                    ? "text-[var(--color-primary)] border-t-2 border-[var(--color-primary)]"
                    : "text-[var(--color-text-dim)] border-t-2 border-transparent",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* CTA central — botão grande chamativo "Novo lead / Campo" */}
          <div className="flex flex-1 items-start justify-center">
            <Link
              href="/campo"
              aria-label="Captar novo lead em campo"
              className="group relative -mt-7 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-[0_8px_24px_-4px_rgba(46,109,180,0.5)] transition-all active:scale-95"
            >
              {/* Glow ring animado quando NÃO está em /campo */}
              {!(pathname === "/campo" || pathname.startsWith("/campo/")) && (
                <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[var(--color-primary)]/30 blur-xl group-hover:bg-[var(--color-primary)]/40" />
              )}
              <Plus className="h-6 w-6" strokeWidth={2.5} />
              <span className="text-[9px] font-bold leading-tight">CAMPO</span>
            </Link>
          </div>

          {MOBILE_TABS_RIGHT.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium",
                  active
                    ? "text-[var(--color-primary)] border-t-2 border-[var(--color-primary)]"
                    : "text-[var(--color-text-dim)] border-t-2 border-transparent",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
