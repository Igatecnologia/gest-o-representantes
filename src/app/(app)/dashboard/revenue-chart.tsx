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
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="#1f2430"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tick={{ fill: "#7a8296", fontSize: 11 }}
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
          tick={{ fill: "#7a8296", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) =>
            new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)
          }
          width={48}
        />
        <Tooltip
          cursor={{ stroke: "#2a3142", strokeWidth: 1 }}
          contentStyle={{
            background: "#151922",
            border: "1px solid #2a3142",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "#7a8296", marginBottom: 4 }}
          formatter={(value: number) => [brl(value), "Vendas"]}
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
          stroke="#a78bfa"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
