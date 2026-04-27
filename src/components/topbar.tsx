"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Kbd } from "./ui";
import { ThemeToggle } from "./theme-toggle";
import { DensityToggle } from "./density-toggle";
import { NotificationInbox } from "./notification-inbox";

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
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-12 items-center justify-between px-6">
        <button
          onClick={openPalette}
          aria-label="Abrir paleta de comandos (Ctrl+K)"
          className="group flex w-full max-w-sm items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-border-strong)]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left text-[13px]">Busca rápida</span>
          <div className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>
        </button>

        <div className="ml-4 flex items-center gap-2">
          <DensityToggle className="hidden md:inline-flex" />
          <NotificationInbox />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
