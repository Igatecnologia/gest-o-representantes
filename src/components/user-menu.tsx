"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Settings, ChevronDown, MapPin } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

/**
 * Menu de usuário com avatar — dropdown com link pra configurações e logout.
 * Útil principalmente no mobile (topbar) onde não há sidebar com user info.
 */
export function UserMenu({
  userName,
  role,
}: {
  userName: string;
  role: "admin" | "manager" | "rep";
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const isAdmin = role === "admin" || role === "manager";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu do usuário"
        className="flex items-center gap-1.5 rounded-md p-1 transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-[11px] font-bold text-white shadow-sm">
          {initials}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-60 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {/* Header com info do user */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[var(--color-text)]">
                  {userName}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isAdmin ? "Administrador" : "Representante"}
                </div>
              </div>
            </div>
          </div>

          {/* Links — visíveis principalmente no mobile (sidebar tem isso no desktop) */}
          <div className="py-1 md:hidden">
            <Link
              href="/clientes/mapa"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" />
              Mapa de clientes
            </Link>
          </div>

          <div className="border-t border-[var(--color-border)] py-1 md:border-t-0">
            <Link
              href="/configuracoes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <Settings className="h-4 w-4 text-[var(--color-text-muted)]" />
              Configurações
            </Link>
          </div>

          {/* Logout — destaque visual */}
          <form action={logoutAction} id="logout-form" className="border-t border-[var(--color-border)]">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/5"
            >
              <LogOut className="h-4 w-4" />
              Sair do sistema
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
