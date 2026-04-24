"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5",
        tone === "primary" && "bg-gradient-brand-subtle"
      )}
    >
      {tone === "primary" && (
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[var(--color-primary)]/25 blur-3xl" />
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {label}
          </span>
          {icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
          {typeof delta === "number" && (
            <div
              className={cn(
                "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium",
                up ? "bg-emerald-500/12 text-emerald-400" : "bg-red-500/12 text-red-400"
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%
            </div>
          )}
        </div>

        {hint && <div className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</div>}

        {sparkline && sparkline.length > 1 && (
          <div className="mt-3 h-10 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#a78bfa"
                  strokeWidth={1.5}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
