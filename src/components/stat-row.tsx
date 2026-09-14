export type StatSegment = {
  label: string;
  value: number;
  /** Omit for a plain count (e.g. total profiles) that isn't a time series. */
  breakdown?: { today: number; week: number; month: number };
};

/** One rounded card divided into equal segments by a hairline divider —
 *  vertical side by side on wider screens, horizontal stacked on mobile. */
export function StatRow({ segments }: { segments: StatSegment[] }) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card sm:flex-row sm:divide-x sm:divide-y-0">
      {segments.map((segment) => (
        <div key={segment.label} className="flex-1 p-6">
          <p className="text-[13px] font-medium text-muted-foreground">{segment.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {segment.value.toLocaleString()}
          </p>
          {segment.breakdown && (
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              Today {segment.breakdown.today} · Week {segment.breakdown.week} · Month{" "}
              {segment.breakdown.month}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
