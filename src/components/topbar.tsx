"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Kbd } from "./ui";
import { ThemeToggle } from "./theme-toggle";
import { DensityToggle } from "./density-toggle";
import { NotificationInbox } from "./notification-inbox";
import { UserMenu } from "./user-menu";

export function Topbar({
  userName,
  role,
}: {
  userName: string;
  role: "admin" | "manager" | "rep";
}) {
  const openPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-12 items-center justify-between gap-2 px-3 md:h-12 md:px-6">
        {/* Logo mobile (substitui o sidebar que está escondido) */}
        <div className="flex items-center gap-2 md:hidden">
          <img
            src="/logo-iga.png"
            alt="IGA"
            width={28}
            height={28}
            className="h-7 w-7 rounded object-contain"
          />
          <span className="text-sm font-bold tracking-tight">IGA</span>
        </div>

        {/* Search desktop (full input) */}
        <button
          onClick={openPalette}
          aria-label="Abrir paleta de comandos (Ctrl+K)"
          className="group hidden w-full max-w-sm items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-border-strong)] md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left text-[13px]">Busca rápida</span>
          <div className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>
        </button>

        <div className="flex items-center gap-1 md:ml-4 md:gap-2">
          {/* Search icon-only mobile */}
          <button
            onClick={openPalette}
            aria-label="Buscar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
          <DensityToggle className="hidden md:inline-flex" />
          <NotificationInbox />
          <ThemeToggle />
          <UserMenu userName={userName} role={role} />
        </div>
      </div>
    </header>
  );
}
