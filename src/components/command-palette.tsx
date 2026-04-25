"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Receipt,
  Wallet,
  Kanban,
  FileText,
  Plus,
  LogOut,
} from "lucide-react";
import { Kbd } from "./ui";

const NAV_ALL = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { label: "Pipeline", href: "/pipeline", icon: Kanban, adminOnly: false },
  { label: "Clientes", href: "/clientes", icon: Building2, adminOnly: false },
  { label: "Propostas", href: "/propostas", icon: FileText, adminOnly: false },
  { label: "Representantes", href: "/representantes", icon: Users, adminOnly: true },
  { label: "Produtos", href: "/produtos", icon: Package, adminOnly: true },
  { label: "Vendas", href: "/vendas", icon: Receipt, adminOnly: false },
  { label: "Comissões", href: "/comissoes", icon: Wallet, adminOnly: false },
];

const CREATE_ALL = [
  { label: "Novo negócio (pipeline)", href: "/pipeline/novo", icon: Plus, adminOnly: false },
  { label: "Novo cliente", href: "/clientes/novo", icon: Plus, adminOnly: false },
  { label: "Nova proposta", href: "/propostas/nova", icon: Plus, adminOnly: false },
  { label: "Nova venda", href: "/vendas/nova", icon: Plus, adminOnly: false },
  { label: "Novo representante", href: "/representantes/novo", icon: Plus, adminOnly: true },
  { label: "Novo produto", href: "/produtos/novo", icon: Plus, adminOnly: true },
];

export function CommandPalette({
  role,
}: {
  role: "admin" | "manager" | "rep";
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const isAdmin = role === "admin" || role === "manager";
  const NAV = NAV_ALL.filter((i) => !i.adminOnly || isAdmin);
  const CREATE = CREATE_ALL.filter((i) => !i.adminOnly || isAdmin);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
      >
        <Command className="flex flex-col" loop>
          <div className="border-b border-[var(--color-border)]">
            <Command.Input
              aria-label="Buscar comandos"
              placeholder="Buscar ou executar uma ação..."
              className="w-full bg-transparent px-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none"
            />
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              Nenhum resultado.
            </Command.Empty>

            <Command.Group
              heading="Ir para"
              className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-dim)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {NAV.map((item) => (
                <Command.Item
                  key={item.href}
                  onSelect={() => go(item.href)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text)] aria-selected:bg-[var(--color-surface-2)]"
                >
                  <item.icon className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Criar"
              className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-dim)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {CREATE.map((item) => (
                <Command.Item
                  key={item.href}
                  onSelect={() => go(item.href)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text)] aria-selected:bg-[var(--color-surface-2)]"
                >
                  <item.icon className="h-4 w-4 text-[var(--color-primary)]" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Sessão"
              className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-dim)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              <Command.Item
                onSelect={() => {
                  setOpen(false);
                  document.getElementById("logout-form")?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  );
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text)] aria-selected:bg-[var(--color-surface-2)]"
              >
                <LogOut className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span>Sair</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[11px] text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>navegar</span>
              <Kbd>↵</Kbd>
              <span>selecionar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Kbd>esc</Kbd>
              <span>fechar</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
