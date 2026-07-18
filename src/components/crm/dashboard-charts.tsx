"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#31C9C0",
  "#0e1b1a",
];

export function LeadsWeeklyChart({
  data,
}: {
  data: { week: string; leads: number }[];
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leads por semana</CardTitle>
        <p className="text-sm text-muted-foreground">Últimas 8 semanas</p>
      </CardHeader>
      <CardContent className="h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#31C9C0" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#31C9C0" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              name="Leads"
              stroke="#31C9C0"
              fill="url(#leadsFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function LeadsSourceChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leads por fuente</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cuánto te trae Konnect ({total} total)
        </p>
      </CardHeader>
      <CardContent className="h-64 pt-2">
        {total === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Aún no hay leads para graficar.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
        <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-1.5 truncate">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              {d.name}: {d.value}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
