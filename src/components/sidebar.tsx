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
  UserCircle,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Badge } from "./ui";
import { motion } from "./motion";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/propostas", label: "Propostas", icon: FileText },
  { href: "/representantes", label: "Representantes", icon: Users, adminOnly: true },
  { href: "/produtos", label: "Produtos", icon: Package, adminOnly: true },
  { href: "/vendas", label: "Vendas", icon: Receipt },
  { href: "/comissoes", label: "Comissões", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const MOBILE_TABS: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/propostas", label: "Propostas", icon: FileText },
  { href: "/campo", label: "Campo", icon: MapPin },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/configuracoes", label: "Conta", icon: UserCircle },
];

export function Sidebar({
  userName,
  role,
}: {
  userName: string;
  role: "admin" | "manager" | "rep";
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      localStorage.setItem("sidebar-collapsed", v ? "0" : "1");
      return !v;
    });
  };

  const isAdmin = role === "admin" || role === "manager";
  const items = NAV.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Menu principal"
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-2xl transition-[width] duration-200 md:flex",
          collapsed ? "w-[68px]" : "w-[248px]"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-[var(--color-border)] px-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-iga.png"
              alt="IGA"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-[var(--radius-sm)] object-contain"
            />
            {!collapsed && (
              <div>
                <span className="font-bold tracking-tight text-sm">IGA</span>
                <span className="ml-1.5 text-[10px] text-[var(--color-text-dim)] font-medium">Representantes</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Navegação principal" className="flex-1 space-y-0.5 px-3 py-4">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                  active
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-x-3 -translate-y-1/2 rounded-r-full bg-gradient-brand"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active ? "text-[var(--color-primary)]" : "group-hover:text-[var(--color-text)]"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-[var(--color-border)] p-3">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-[var(--radius)] bg-[var(--color-surface-2)]/50 p-2.5">
              <Avatar name={userName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{userName}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {isAdmin ? (
                    <Badge tone="brand" className="px-1.5 py-0 text-[10px]">
                      Admin
                    </Badge>
                  ) : (
                    <Badge tone="default" className="px-1.5 py-0 text-[10px]">
                      Representante
                    </Badge>
                  )}
                  <form id="logout-form" action="/logout" method="post">
                    <button
                      type="submit"
                      aria-label="Sair da conta"
                      className="text-[10px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    >
                      Sair
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <Avatar name={userName} size="sm" />
            </div>
          )}

          <button
            onClick={toggle}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] p-2 text-xs text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-muted)]"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav aria-label="Navegação mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-2xl md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_TABS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-all duration-150 min-w-0",
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-dim)]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-tab-active"
                    className="absolute -top-2 h-0.5 w-8 rounded-full bg-gradient-brand shadow-[0_0_8px_rgba(46,109,180,0.5)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(46,109,180,0.5)]")} />
                <span className="truncate max-w-[56px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
