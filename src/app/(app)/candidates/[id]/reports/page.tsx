import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCandidateById } from "@/lib/repo/candidates";
import { listApplicationsFiltered } from "@/lib/repo/applications";
import { listReportEntriesFiltered, listReportEntriesForCandidate } from "@/lib/repo/report-entries";
import {
  buildByDayMap,
  buildMonthlyBars,
  buildWeeklyBars,
  computeTodayWeekMonth,
} from "@/lib/report-metrics";
import { canAccessCandidate, canEditReportEntry } from "@/lib/authz";
import { StatRow } from "@/components/stat-row";
import { ToggleBarChart } from "@/components/toggle-bar-chart";
import { AddReportDialog } from "@/components/add-report-dialog";
import { EditReportDialog } from "@/components/edit-report-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Screen 2 (per claude-code-dashboard-prompt.md): a dedicated, candidate-scoped
// "zoomed in" version of the recruiter dashboard's stat-row + toggle-chart
// pattern, plus the full chronological report-entry log the main dashboard
// intentionally omits. Reached only via Candidate Profile → Reports tab →
// "View full reports" — this is not the org-wide /reports page.
export default async function CandidateFullReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const [session, { id }, { from, to }] = await Promise.all([getSession(), params, searchParams]);
  if (!session) redirect("/login");

  const client = createSupabaseServerClient();
  const candidate = await findCandidateById(client, id);
  if (!candidate) notFound();

  const canManage = canAccessCandidate(session, candidate);
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;
  const now = new Date();

  // Unranged for the chart/stat source data — the "Total" figures are
  // all-time and the weekly/monthly bucketing only looks at the current
  // week/month slice of it. The log table below is separately date-filtered.
  const [applications, reportEntriesForChart, logEntries] = await Promise.all([
    listApplicationsFiltered(client, { candidateIds: [id] }),
    listReportEntriesFiltered(client, { candidateIds: [id] }),
    listReportEntriesForCandidate(client, id, { from: fromDate, to: toDate }),
  ]);

  const byDay = buildByDayMap(applications, reportEntriesForChart);
  const applicationsStat = computeTodayWeekMonth(byDay, "applications", now);
  const interviewsStat = computeTodayWeekMonth(byDay, "interviews", now);
  const offersStat = computeTodayWeekMonth(byDay, "offers", now);
  const totalApplications =
    applications.length + reportEntriesForChart.reduce((sum, e) => sum + e.applicationsCount, 0);
  const totalInterviews =
    applications.filter((a) => a.status === "INTERVIEW").length +
    reportEntriesForChart.reduce((sum, e) => sum + e.interviewsCount, 0);
  const totalOffers =
    applications.filter((a) => a.status === "OFFER").length +
    reportEntriesForChart.reduce((sum, e) => sum + e.offersCount, 0);

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href={`/candidates/${id}?tab=reports`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to {candidate.name}
      </Link>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Reports — {candidate.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Full activity log for this candidate.</p>
        </div>
        {canManage && <AddReportDialog candidateId={id} />}
      </div>

      <div className="mt-6">
        <StatRow
          segments={[
            { label: "Applications", value: totalApplications, breakdown: applicationsStat },
            { label: "Interviews", value: totalInterviews, breakdown: interviewsStat },
            { label: "Offers", value: totalOffers, breakdown: offersStat },
          ]}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ToggleBarChart
          title="Applications"
          metricLabel="applications"
          weeklyData={buildWeeklyBars(byDay, now, "applications")}
          monthlyData={buildMonthlyBars(byDay, now, "applications")}
        />
        <ToggleBarChart
          title="Interviews"
          metricLabel="interviews"
          weeklyData={buildWeeklyBars(byDay, now, "interviews")}
          monthlyData={buildMonthlyBars(byDay, now, "interviews")}
        />
      </div>

      <form className="mt-8 flex flex-wrap items-center gap-2" method="get">
        <DatePicker name="from" defaultValue={from} className="w-40" />
        <span className="text-sm text-muted-foreground">to</span>
        <DatePicker name="to" defaultValue={to} className="w-40" />
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {(from || to) && (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/candidates/${id}/reports`} />}
          >
            Clear
          </Button>
        )}
      </form>

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Interviews</TableHead>
              <TableHead>Offers</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Logged by</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No report entries in this range.
                </TableCell>
              </TableRow>
            )}
            {logEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground">{entry.date.toLocaleDateString()}</TableCell>
                <TableCell className="text-foreground tabular-nums">{entry.applicationsCount}</TableCell>
                <TableCell className="text-foreground tabular-nums">{entry.interviewsCount}</TableCell>
                <TableCell className="text-foreground tabular-nums">{entry.offersCount}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {entry.notes || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.createdByName}</TableCell>
                <TableCell>
                  {canEditReportEntry(session, candidate, entry) && (
                    <EditReportDialog entry={entry} candidateId={id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
