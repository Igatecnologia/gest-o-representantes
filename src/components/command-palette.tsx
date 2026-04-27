"use client";

import * as React from "react";
import dynamic from "next/dynamic";

// UI carrega cmdk (~30KB) — só baixa quando usuário abre via Cmd+K.
// Wrapper leve fica no bundle inicial só com o keyboard listener.
const CommandPaletteUI = dynamic(() => import("./command-palette-ui"), {
  ssr: false,
});

export function CommandPalette({
  role,
}: {
  role: "admin" | "manager" | "rep";
}) {
  const [open, setOpen] = React.useState(false);

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

  if (!open) return null;
  return <CommandPaletteUI role={role} onClose={() => setOpen(false)} />;
}
