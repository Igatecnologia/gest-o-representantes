"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Kbd } from "./ui";

export function Topbar() {
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
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/70 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6">
        <button
          onClick={openPalette}
          aria-label="Abrir paleta de comandos (Ctrl+K)"
          className="group flex w-full max-w-md items-center gap-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Buscar ou executar comando...</span>
          <div className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>
        </button>

        <div className="ml-4 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span className="hidden md:inline">
            {new Intl.DateTimeFormat("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            }).format(new Date())}
          </span>
        </div>
      </div>
    </header>
  );
}
