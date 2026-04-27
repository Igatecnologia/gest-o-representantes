"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type Density = "compact" | "comfortable" | "spacious";

const STORAGE_KEY = "iga-density";

/**
 * Toggle de densidade visual. Salva preferência em localStorage e aplica
 * data-density="..." no <html>, que dispara regras CSS de spacing/font-size.
 */
export function DensityToggle({ className }: { className?: string }) {
  const [density, setDensity] = useState<Density>("comfortable");
  const [mounted, setMounted] = useState(false);

  // Recupera do localStorage no mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Density | null;
      if (saved && ["compact", "comfortable", "spacious"].includes(saved)) {
        setDensity(saved);
        document.documentElement.dataset.density = saved;
      } else {
        document.documentElement.dataset.density = "comfortable";
      }
    } catch {
      /* noop */
    }
    setMounted(true);
  }, []);

  function handleChange(next: Density) {
    setDensity(next);
    document.documentElement.dataset.density = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* noop */
    }
  }

  if (!mounted) return null;

  const options: { id: Density; label: string; icon: typeof Square }[] = [
    { id: "compact", label: "Compacto", icon: Minimize2 },
    { id: "comfortable", label: "Padrão", icon: Square },
    { id: "spacious", label: "Espaçoso", icon: Maximize2 },
  ];

  return (
    <div
      className={cn(
        "inline-flex rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Densidade da interface"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = density === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => handleChange(opt.id)}
            role="radio"
            aria-checked={active}
            title={opt.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
