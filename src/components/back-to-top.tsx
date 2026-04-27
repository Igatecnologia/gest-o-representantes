"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * FAB que aparece após scroll de 600px (mobile-first).
 * Volta ao topo da página suavemente.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_8px_20px_-4px_rgba(46,109,180,0.5)] transition-all active:scale-95 md:bottom-6 md:right-6"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
