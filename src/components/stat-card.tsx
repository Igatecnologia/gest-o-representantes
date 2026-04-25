"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCard } from "./motion";

export function StatCard({
  label,
  value,
  delta,
  hint,
  sparkline,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  sparkline?: number[];
  tone?: "default" | "primary";
  icon?: React.ReactNode;
}) {
  const data = (sparkline ?? []).map((v, i) => ({ i, v }));
  const up = (delta ?? 0) >= 0;
  const gradientId = `g-${label.replace(/\s+/g, "")}`;

  return (
    <HoverCard
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-5 transition-all duration-300",
        tone === "primary"
          ? "border-[color:var(--color-primary)]/20 bg-gradient-brand-subtle shadow-[0_0_24px_-4px_rgba(46,109,180,0.15)]"
          : "border-[var(--color-border)] card-glow"
      )}
    >
      {/* Ambient glow */}
      {tone === "primary" && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[var(--color-primary)]/15 blur-3xl glow-pulse" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[var(--color-accent)]/10 blur-3xl glow-pulse" />
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {label}
          </span>
          {icon && (
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
              tone === "primary"
                ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]"
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
                up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
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
                    <stop offset="0%" stopColor="#2e6db4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2e6db4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#4a90d9"
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
