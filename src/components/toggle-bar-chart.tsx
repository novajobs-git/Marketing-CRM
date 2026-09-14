"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartBar } from "@/lib/report-metrics";
import { cn } from "@/lib/utils";

// recharts v3's Tooltip `content` render-prop type excludes the very
// active/payload/label fields it passes at runtime (they're marked
// "read from context"), so this is typed loosely against what's actually
// received rather than fought into recharts' own prop type.
function ChartTooltip({ metricLabel, ...props }: { metricLabel: string } & Record<string, unknown>) {
  const active = props.active as boolean | undefined;
  const payload = props.payload as { value?: number }[] | undefined;
  const label = props.label as string | undefined;
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-[var(--overlay-shadow)]">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="tabular-nums font-semibold text-foreground">{payload[0]?.value ?? 0}</span>{" "}
        {metricLabel}
      </p>
    </div>
  );
}

/** A single-series bar chart with an independent Weekly/Monthly toggle in the
 *  card header. Switching granularity swaps pre-computed data — no refetch —
 *  so it reads as a zoom change, not a different chart. */
export function ToggleBarChart({
  title,
  metricLabel,
  weeklyData,
  monthlyData,
}: {
  title: string;
  metricLabel: string;
  weeklyData: ChartBar[];
  monthlyData: ChartBar[];
}) {
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");
  const data = range === "weekly" ? weeklyData : monthlyData;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
          {(["weekly", "monthly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium capitalize transition-colors",
                range === option
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={<ChartTooltip metricLabel={metricLabel} />}
            />
            <Bar dataKey="value" name={metricLabel} fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
