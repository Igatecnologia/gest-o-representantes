import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Sparkline inline em SVG — evita carregar Recharts (~120KB) só pra desenhar
// uma linha. Para o caso simples (KPI card) o ganho de bundle compensa.
function Sparkline({
  data,
  stroke,
  fill,
  gradientId,
}: {
  data: number[];
  stroke: string;
  fill: string;
  gradientId: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const last = data.length - 1;
  const points = data
    .map((v, i) => {
      const x = (i / last) * 100;
      const y = 100 - ((v - min) / range) * 90 - 5; // padding 5% topo e baixo
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" L ");
  const linePath = `M ${points}`;
  const areaPath = `${linePath} L 100,100 L 0,100 Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.8} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export type StatTone = "blue" | "emerald" | "amber" | "violet" | "cyan" | "rose";

const TONE_CONFIG: Record<
  StatTone,
  {
    iconBg: string;
    iconText: string;
    sparkStroke: string;
    sparkFill: string;
    borderColor: string;
  }
> = {
  blue: {
    iconBg: "bg-blue-50",
    iconText: "text-[var(--color-primary)]",
    sparkStroke: "#2e6db4",
    sparkFill: "#2e6db430",
    borderColor: "border-l-[var(--color-primary)]",
  },
  emerald: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    sparkStroke: "#059669",
    sparkFill: "#05966930",
    borderColor: "border-l-emerald-500",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    sparkStroke: "#d97706",
    sparkFill: "#d9770630",
    borderColor: "border-l-amber-500",
  },
  violet: {
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
    sparkStroke: "#7c3aed",
    sparkFill: "#7c3aed30",
    borderColor: "border-l-violet-500",
  },
  cyan: {
    iconBg: "bg-cyan-50",
    iconText: "text-cyan-600",
    sparkStroke: "#0891b2",
    sparkFill: "#0891b230",
    borderColor: "border-l-cyan-500",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    sparkStroke: "#e11d48",
    sparkFill: "#e11d4830",
    borderColor: "border-l-rose-500",
  },
};

export function StatCard({
  label,
  value,
  delta,
  hint,
  sparkline,
  tone = "blue",
  icon,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  sparkline?: number[];
  tone?: StatTone;
  icon?: React.ReactNode;
}) {
  const cfg = TONE_CONFIG[tone];
  const up = (delta ?? 0) >= 0;
  const gradientId = `g-${label.replace(/\s+/g, "")}`;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] border-l-[3px] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md",
        cfg.borderColor
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
          {label}
        </span>
        {icon && (
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            cfg.iconBg, cfg.iconText
          )}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-[26px] font-bold tabular-nums tracking-tight leading-none text-[var(--color-text)]">
          {value}
        </div>
        {typeof delta === "number" && (
          <div
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold",
              up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>

      {hint && <div className="mt-1 text-[12px] text-[var(--color-text-muted)]">{hint}</div>}

      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 h-10 -mx-1">
          <Sparkline
            data={sparkline}
            stroke={cfg.sparkStroke}
            fill={cfg.sparkFill}
            gradientId={gradientId}
          />
        </div>
      )}
    </div>
  );
}
