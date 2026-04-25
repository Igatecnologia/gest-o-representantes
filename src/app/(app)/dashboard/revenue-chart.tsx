"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl } from "@/lib/utils";

type Point = { day: string; total: number };

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e6db4" stopOpacity={0.35} />
            <stop offset="50%" stopColor="#2e6db4" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#2e6db4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2e6db4" />
            <stop offset="100%" stopColor="#7bb3e0" />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="#1a1f2e"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
              .toString()
              .padStart(2, "0")}`;
          }}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) =>
            new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)
          }
          width={48}
        />
        <Tooltip
          cursor={{ stroke: "#262d40", strokeWidth: 1 }}
          contentStyle={{
            background: "#12151e",
            border: "1px solid #262d40",
            borderRadius: 12,
            fontSize: 13,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
          labelStyle={{ color: "#6b7280", marginBottom: 6, fontSize: 11 }}
          formatter={(value) => [brl(Number(value)), "Vendas"]}
          labelFormatter={(v) => {
            const d = new Date(v);
            return d.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
            });
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="url(#strokeGradient)"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
