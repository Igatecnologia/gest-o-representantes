import { brl } from "@/lib/utils";
import { Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Card de progresso de meta. Server Component — recebe valores em centavos.
 */
export function GoalProgress({
  current,
  goal,
  label = "Meta do mês",
  hint,
}: {
  current: number;
  goal: number;
  label?: string;
  hint?: string;
}) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const reached = pct >= 100;
  const remaining = Math.max(0, goal - current);

  // Faltam X dias até fim do mês
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = Math.max(
    0,
    Math.ceil((lastDay.getTime() - today.getTime()) / (24 * 3600 * 1000)),
  );

  if (goal === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center">
        <Target className="mx-auto mb-2 h-6 w-6 text-[var(--color-text-dim)]" />
        <p className="text-sm font-medium text-[var(--color-text-muted)]">
          Sem meta cadastrada
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-dim)]">
          O admin pode definir uma meta mensal pra você no cadastro do
          representante.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-5",
        reached
          ? "border-emerald-500/40 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
          : "border-[var(--color-border)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {reached ? (
              <Trophy className="h-3 w-3 text-emerald-500" />
            ) : (
              <Target className="h-3 w-3 text-[var(--color-primary)]" />
            )}
            {label}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums">{brl(current)}</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              / {brl(goal)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-2xl font-bold tabular-nums leading-none",
              reached ? "text-emerald-500" : "text-[var(--color-primary)]",
            )}
          >
            {pct.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            reached
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        {reached ? (
          <span className="font-semibold text-emerald-600">
            🎉 Meta batida! Bater de novo até o fim do mês?
          </span>
        ) : (
          <span>
            Faltam <strong className="tabular-nums">{brl(remaining)}</strong>
          </span>
        )}
        <span>
          {daysLeft} dia{daysLeft === 1 ? "" : "s"} no mês
        </span>
      </div>

      {hint && (
        <p className="mt-2 text-[10px] text-[var(--color-text-dim)]">{hint}</p>
      )}
    </div>
  );
}
