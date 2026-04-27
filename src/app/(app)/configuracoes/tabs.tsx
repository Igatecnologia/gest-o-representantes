"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Shield, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/configuracoes", label: "Minha Conta", icon: Lock },
  { href: "/configuracoes/aparencia", label: "Aparência", icon: Palette },
  { href: "/configuracoes/acessos", label: "Gerenciar Acessos", icon: Shield, adminOnly: true },
];

export function ConfigTabs({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="mb-6 flex gap-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {items.map((tab) => {
        const active =
          tab.href === "/configuracoes"
            ? pathname === "/configuracoes"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "bg-[var(--color-primary)]/10 text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
            )}
          >
            <tab.icon className={cn("h-4 w-4", active && "text-[var(--color-primary)]")} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
