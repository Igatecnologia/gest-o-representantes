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
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Badge } from "./ui";

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
  { href: "/representantes", label: "Representantes", icon: Users, adminOnly: true },
  { href: "/produtos", label: "Produtos", icon: Package, adminOnly: true },
  { href: "/vendas", label: "Vendas", icon: Receipt },
  { href: "/comissoes", label: "Comissões", icon: Wallet },
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
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-xl transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className="flex h-14 items-center border-b border-[var(--color-border)] px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-brand shadow-[0_0_16px_rgba(139,92,246,0.35)]">
            <span className="font-bold text-white text-sm">S</span>
          </div>
          {!collapsed && (
            <span className="font-semibold tracking-tight">SalesOps</span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-x-2 -translate-y-1/2 rounded-r-full bg-gradient-brand" />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-[var(--color-primary)]" : ""
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] p-2">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-md p-2">
            <Avatar name={userName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-sm font-medium">{userName}</div>
              </div>
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
                    className="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
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
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-md p-2 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              Recolher
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
