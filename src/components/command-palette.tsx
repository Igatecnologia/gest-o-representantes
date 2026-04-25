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
  Search,
} from "lucide-react";
import { Kbd } from "./ui";

type SearchResult = { type: string; id: string; label: string; href: string };

const NAV_ALL = [
  { label: "Representantes", href: "/representantes", icon: Users, adminOnly: true },
  { label: "Clientes", href: "/clientes", icon: Building2, adminOnly: false },
  { label: "Produtos", href: "/produtos", icon: Package, adminOnly: true },
  { label: "Pipeline", href: "/pipeline", icon: Kanban, adminOnly: false },
  { label: "Propostas", href: "/propostas", icon: FileText, adminOnly: false },
  { label: "Vendas", href: "/vendas", icon: Receipt, adminOnly: false },
  { label: "Comissoes", href: "/comissoes", icon: Wallet, adminOnly: false },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
];

const CREATE_ALL = [
  { label: "Novo cliente", href: "/clientes/novo", icon: Plus, adminOnly: false },
  { label: "Nova proposta", href: "/propostas/nova", icon: Plus, adminOnly: false },
  { label: "Nova venda", href: "/vendas/nova", icon: Plus, adminOnly: false },
  { label: "Novo negocio", href: "/pipeline/novo", icon: Plus, adminOnly: false },
  { label: "Novo representante", href: "/representantes/novo", icon: Plus, adminOnly: true },
  { label: "Novo produto", href: "/produtos/novo", icon: Plus, adminOnly: true },
];

const TYPE_ICONS: Record<string, typeof Building2> = {
  cliente: Building2,
  produto: Package,
  proposta: FileText,
};

export function CommandPalette({
  role,
}: {
  role: "admin" | "manager" | "rep";
}) {
  const [open, setOpen] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const router = useRouter();
  const isAdmin = role === "admin" || role === "manager";
  const NAV = NAV_ALL.filter((i) => !i.adminOnly || isAdmin);
  const CREATE = CREATE_ALL.filter((i) => !i.adminOnly || isAdmin);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

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
    setSearchResults([]);
    router.push(href);
  };

  function handleValueChange(value: string) {
    clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSearchResults(data.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

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
        <Command className="flex flex-col" loop shouldFilter={searchResults.length === 0}>
          <div className="border-b border-[var(--color-border)]">
            <Command.Input
              aria-label="Buscar"
              placeholder="Buscar clientes, propostas, produtos..."
              onValueChange={handleValueChange}
              className="w-full bg-transparent px-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none"
            />
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              {searching ? "Buscando..." : "Nenhum resultado."}
            </Command.Empty>

            {/* Resultados da busca global */}
            {searchResults.length > 0 && (
              <Command.Group
                heading="Resultados"
                className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-dim)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {searchResults.map((r) => {
                  const Icon = TYPE_ICONS[r.type] ?? Search;
                  return (
                    <Command.Item
                      key={`${r.type}-${r.id}`}
                      value={`${r.type} ${r.label}`}
                      onSelect={() => go(r.href)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text)] aria-selected:bg-[var(--color-surface-2)]"
                    >
                      <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                      <span className="flex-1 truncate">{r.label}</span>
                      <span className="text-[10px] text-[var(--color-text-dim)] capitalize">{r.type}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

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
                  <item.icon className="h-4 w-4 text-emerald-400" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Sessao"
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
              <Kbd>↑</Kbd><Kbd>↓</Kbd><span>navegar</span>
              <Kbd>↵</Kbd><span>selecionar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Kbd>esc</Kbd><span>fechar</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
