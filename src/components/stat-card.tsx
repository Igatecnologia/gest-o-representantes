"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCard } from "./motion";

export type StatTone = "blue" | "emerald" | "amber" | "violet" | "cyan" | "rose";

const TONE_CONFIG: Record<
  StatTone,
  {
    glow: string;
    iconBg: string;
    iconText: string;
    sparkStroke: string;
    sparkFill: string;
    orbColor: string;
    orbColor2: string;
    border: string;
  }
> = {
  blue: {
    glow: "card-glow-blue",
    iconBg: "bg-[var(--color-primary)]/15",
    iconText: "text-[var(--color-primary-light)]",
    sparkStroke: "#2e6db4",
    sparkFill: "#2e6db4",
    orbColor: "bg-[var(--color-primary)]/20",
    orbColor2: "bg-[var(--color-accent)]/10",
    border: "border-[var(--color-primary)]/15",
  },
  emerald: {
    glow: "card-glow-emerald",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
    sparkStroke: "#10b981",
    sparkFill: "#10b981",
    orbColor: "bg-emerald-500/20",
    orbColor2: "bg-teal-500/10",
    border: "border-emerald-500/15",
  },
  amber: {
    glow: "card-glow-amber",
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-400",
    sparkStroke: "#f59e0b",
    sparkFill: "#f59e0b",
    orbColor: "bg-amber-500/20",
    orbColor2: "bg-orange-500/10",
    border: "border-amber-500/15",
  },
  violet: {
    glow: "card-glow-violet",
    iconBg: "bg-violet-600/15",
    iconText: "text-violet-400",
    sparkStroke: "#7c3aed",
    sparkFill: "#7c3aed",
    orbColor: "bg-violet-600/20",
    orbColor2: "bg-purple-600/10",
    border: "border-violet-600/15",
  },
  cyan: {
    glow: "card-glow-cyan",
    iconBg: "bg-cyan-500/15",
    iconText: "text-cyan-400",
    sparkStroke: "#0891b2",
    sparkFill: "#0891b2",
    orbColor: "bg-cyan-500/20",
    orbColor2: "bg-sky-500/10",
    border: "border-cyan-500/15",
  },
  rose: {
    glow: "card-glow-rose",
    iconBg: "bg-rose-500/15",
    iconText: "text-rose-400",
    sparkStroke: "#f43f5e",
    sparkFill: "#f43f5e",
    orbColor: "bg-rose-500/20",
    orbColor2: "bg-pink-500/10",
    border: "border-rose-500/15",
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
  const data = (sparkline ?? []).map((v, i) => ({ i, v }));
  const up = (delta ?? 0) >= 0;
  const gradientId = `g-${label.replace(/\s+/g, "")}`;

  return (
    <HoverCard
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-5 transition-all duration-300",
        cfg.glow,
        cfg.border
      )}
    >
      {/* Orbs de cor flutuantes */}
      <div className="pointer-events-none absolute inset-0">
        <div className={cn("absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl glow-pulse orb-float", cfg.orbColor)} />
        <div className={cn("absolute -bottom-8 -left-8 h-28 w-28 rounded-full blur-3xl glow-pulse", cfg.orbColor2)} style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {label}
          </span>
          {icon && (
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)]",
              cfg.iconBg, cfg.iconText
            )}>
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <div className="text-[28px] font-semibold tabular-nums tracking-tight leading-none">{value}</div>
          {typeof delta === "number" && (
            <div
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                up ? "bg-emerald-500/12 text-emerald-400" : "bg-red-500/12 text-red-400"
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%
            </div>
          )}
        </div>

        {hint && <div className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</div>}

        {sparkline && sparkline.length > 1 && (
          <div className="mt-4 h-12 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cfg.sparkFill} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={cfg.sparkFill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={cfg.sparkStroke}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </HoverCard>
  );
}
