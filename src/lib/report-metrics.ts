import type { ApplicationForReport } from "@/lib/repo/applications";
import type { ReportEntryForReport } from "@/lib/repo/report-entries";

// Shared by the recruiter/admin dashboard and the per-candidate full-reports
// screen: both show the same stat-row + weekly/monthly toggle-chart pattern,
// just scoped to a different candidate set. All date math is UTC-based,
// matching the rest of the app's `.toISOString().slice(0, 10)` day-key
// convention (see reports/page.tsx) rather than local time.

export type MetricKey = "applications" | "interviews" | "offers";

export type DayMetrics = { applications: number; interviews: number; offers: number };

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emptyMetrics(): DayMetrics {
  return { applications: 0, interviews: 0, offers: 0 };
}

/** Merges logged Applications (current status → interview/offer only) with
 *  manual report_entries into one per-day metrics map. The "applications"
 *  count is deliberately sourced from report_entries alone: a logged
 *  Application here is a tailored resume/JD pair ("Resume Edits"), not
 *  necessarily one real submitted application, so it never adds to the
 *  applications total — recruiters log the real total manually via Reports. */
export function buildByDayMap(
  applications: ApplicationForReport[],
  reportEntries: ReportEntryForReport[]
): Map<string, DayMetrics> {
  const byDay = new Map<string, DayMetrics>();

  function bucket(key: string): DayMetrics {
    let m = byDay.get(key);
    if (!m) {
      m = emptyMetrics();
      byDay.set(key, m);
    }
    return m;
  }

  for (const app of applications) {
    const m = bucket(dateKey(app.appliedDate));
    if (app.status === "INTERVIEW") m.interviews += 1;
    if (app.status === "OFFER") m.offers += 1;
  }

  for (const entry of reportEntries) {
    const m = bucket(dateKey(entry.date));
    m.applications += entry.applicationsCount;
    m.interviews += entry.interviewsCount;
    m.offers += entry.offersCount;
  }

  return byDay;
}

export function startOfWeekUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

export function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function sumRange(byDay: Map<string, DayMetrics>, from: Date, to: Date, metric: MetricKey): number {
  let total = 0;
  for (let d = new Date(from); d <= to; d = addDaysUTC(d, 1)) {
    total += byDay.get(dateKey(d))?.[metric] ?? 0;
  }
  return total;
}

/** Today / week-to-date / month-to-date totals for the stat row. */
export function computeTodayWeekMonth(
  byDay: Map<string, DayMetrics>,
  metric: MetricKey,
  now: Date
): { today: number; week: number; month: number } {
  return {
    today: byDay.get(dateKey(now))?.[metric] ?? 0,
    week: sumRange(byDay, startOfWeekUTC(now), now, metric),
    month: sumRange(byDay, startOfMonthUTC(now), now, metric),
  };
}

/** A single chart bar. Named ChartBar (not Bar) to avoid colliding with
 *  recharts' own `Bar` component in files that import both. */
export type ChartBar = { label: string; value: number };

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 7 bars, Monday through Sunday, for the week containing `now`. */
export function buildWeeklyBars(byDay: Map<string, DayMetrics>, now: Date, metric: MetricKey): ChartBar[] {
  const weekStart = startOfWeekUTC(now);
  return WEEKDAY_LABELS.map((label, i) => ({
    label,
    value: byDay.get(dateKey(addDaysUTC(weekStart, i)))?.[metric] ?? 0,
  }));
}

/** Coarser view of the same chart: the current month chunked into 7-day
 *  "Week 1"–"Week 4/5" buckets (a zoom change, not a different chart type). */
export function buildMonthlyBars(byDay: Map<string, DayMetrics>, now: Date, metric: MetricKey): ChartBar[] {
  const monthStart = startOfMonthUTC(now);
  const monthEnd = endOfMonthUTC(now);
  const bars: ChartBar[] = [];
  let weekIndex = 1;
  for (let chunkStart = monthStart; chunkStart <= monthEnd; chunkStart = addDaysUTC(chunkStart, 7)) {
    const chunkEnd = new Date(Math.min(addDaysUTC(chunkStart, 6).getTime(), monthEnd.getTime()));
    bars.push({ label: `Week ${weekIndex}`, value: sumRange(byDay, chunkStart, chunkEnd, metric) });
    weekIndex++;
  }
  return bars;
}
