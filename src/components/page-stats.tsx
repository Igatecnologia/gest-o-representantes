import { cn } from "@/lib/utils";

export type StatTone = "primary" | "emerald" | "amber" | "violet" | "cyan" | "rose";

const TONE: Record<
  StatTone,
  { border: string; bg: string; text: string; iconBg: string }
> = {
  primary: {
    border: "border-l-[var(--color-primary)]",
    bg: "bg-[var(--color-primary)]/5",
    text: "text-[var(--color-primary)]",
    iconBg: "bg-[var(--color-primary)]/10",
  },
  emerald: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    text: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
  },
  amber: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    text: "text-amber-600",
    iconBg: "bg-amber-500/10",
  },
  violet: {
    border: "border-l-violet-500",
    bg: "bg-violet-500/5",
    text: "text-violet-600",
    iconBg: "bg-violet-500/10",
  },
  cyan: {
    border: "border-l-cyan-500",
    bg: "bg-cyan-500/5",
    text: "text-cyan-600",
    iconBg: "bg-cyan-500/10",
  },
  rose: {
    border: "border-l-rose-500",
    bg: "bg-rose-500/5",
    text: "text-rose-600",
    iconBg: "bg-rose-500/10",
  },
};

export type PageStat = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
  icon?: React.ComponentType<{ className?: string }>;
};

/**
 * Linha compacta de stats no topo de páginas index.
 * Substitui a lista vazia por um resumo visual leve.
 *
 * Versão "leve" do StatCard: sem sparkline, sem delta — só número e label.
 */
export function PageStats({ stats }: { stats: PageStat[] }) {
  if (stats.length === 0) return null;
  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-2 gap-3 md:grid-cols-3",
        stats.length >= 4 && "lg:grid-cols-4",
      )}
    >
      {stats.map((s) => {
        const t = TONE[s.tone ?? "primary"];
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] border-l-[3px] bg-[var(--color-surface)] px-4 py-3 transition-shadow hover:shadow-sm",
              t.border,
            )}
          >
            {Icon && (
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                  t.iconBg,
                )}
              >
                <Icon className={cn("h-4 w-4", t.text)} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {s.label}
              </div>
              <div className="text-lg font-bold tabular-nums leading-tight text-[var(--color-text)]">
                {s.value}
              </div>
              {s.hint && (
                <div className="text-[10px] text-[var(--color-text-dim)]">
                  {s.hint}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
