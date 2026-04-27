import { cn } from "@/lib/utils";

type DayActivity = {
  day: string; // YYYY-MM-DD
  count: number;
};

/**
 * Heatmap calendário estilo GitHub.
 * Renderiza grid de 90 dias × intensidade de atividade.
 * Server Component — recebe dados já processados.
 */
export function ActivityHeatmap({
  data,
  weeks = 13, // ~90 dias
}: {
  data: DayActivity[];
  weeks?: number;
}) {
  // Mapa rápido por dia
  const map = new Map(data.map((d) => [d.day, d.count]));

  // Acha max pra normalizar intensidades
  const max = Math.max(1, ...data.map((d) => d.count));

  // Gera grid: weeks colunas × 7 dias
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { day: string; count: number; date: Date }[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, count: map.get(key) ?? 0, date: d });
  }

  function intensity(count: number): string {
    if (count === 0) return "bg-[var(--color-surface-2)]";
    const ratio = count / max;
    if (ratio < 0.25) return "bg-[var(--color-primary)]/20";
    if (ratio < 0.5) return "bg-[var(--color-primary)]/40";
    if (ratio < 0.75) return "bg-[var(--color-primary)]/65";
    return "bg-[var(--color-primary)]";
  }

  // Agrupa por semana (colunas)
  const cols: typeof days[] = [];
  for (let w = 0; w < weeks; w++) {
    cols.push(days.slice(w * 7, w * 7 + 7));
  }

  const totalActivity = data.reduce((acc, d) => acc + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <div>
          <span className="font-semibold tabular-nums text-[var(--color-text)]">
            {totalActivity}
          </span>
          <span className="ml-1 text-[var(--color-text-muted)]">
            ações em {weeks * 7} dias
          </span>
        </div>
        <div className="text-[var(--color-text-muted)]">
          <span className="font-semibold tabular-nums">{activeDays}</span> dias
          ativos
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-[3px]">
          {cols.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {col.map((d) => (
                <div
                  key={d.day}
                  className={cn(
                    "h-[11px] w-[11px] rounded-[2px]",
                    intensity(d.count),
                  )}
                  title={`${d.day}: ${d.count} venda(s)`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-[var(--color-text-muted)]">
        <span>Menos</span>
        <div className="flex gap-[3px]">
          <div className="h-[11px] w-[11px] rounded-[2px] bg-[var(--color-surface-2)]" />
          <div className="h-[11px] w-[11px] rounded-[2px] bg-[var(--color-primary)]/20" />
          <div className="h-[11px] w-[11px] rounded-[2px] bg-[var(--color-primary)]/40" />
          <div className="h-[11px] w-[11px] rounded-[2px] bg-[var(--color-primary)]/65" />
          <div className="h-[11px] w-[11px] rounded-[2px] bg-[var(--color-primary)]" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  );
}
