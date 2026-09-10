import Link from "next/link";
import { X } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listCandidates, findCandidateById } from "@/lib/repo/candidates";
import { listRecruiters } from "@/lib/repo/users";
import { listReportEntriesFiltered } from "@/lib/repo/report-entries";
import { listApplicationsFiltered } from "@/lib/repo/applications";
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

type DayTotals = {
  applications: number;
  interviews: number;
  offers: number;
  candidates: Map<string, { name: string; applications: number; interviews: number; offers: number }>;
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ candidate?: string; recruiter?: string; from?: string; to?: string }>;
}) {
  const [session, { candidate: candidateId, recruiter, from, to }] = await Promise.all([
    getSession(),
    searchParams,
  ]);
  if (!session) redirect("/login");

  const client = createSupabaseServerClient();

  let candidateIds: string[] | undefined;
  if (candidateId) {
    candidateIds = [candidateId];
  } else if (recruiter) {
    const matching = await listCandidates(client, { assignedRecruiterId: recruiter });
    candidateIds = matching.map((c) => c.id);
  }

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const [reportEntries, applications, recruiters, candidateInfo] = await Promise.all([
    listReportEntriesFiltered(client, { candidateIds, from: fromDate, to: toDate }),
    listApplicationsFiltered(client, { candidateIds, from: fromDate, to: toDate }),
    listRecruiters(client),
    candidateId ? findCandidateById(client, candidateId) : Promise.resolve(null),
  ]);

  const byDay = new Map<string, DayTotals>();

  function dayBucket(dateKey: string): DayTotals {
    let bucket = byDay.get(dateKey);
    if (!bucket) {
      bucket = { applications: 0, interviews: 0, offers: 0, candidates: new Map() };
      byDay.set(dateKey, bucket);
    }
    return bucket;
  }

  function candidateBucket(day: DayTotals, id: string, name: string) {
    let c = day.candidates.get(id);
    if (!c) {
      c = { name, applications: 0, interviews: 0, offers: 0 };
      day.candidates.set(id, c);
    }
    return c;
  }

  for (const entry of reportEntries) {
    if (!entry.candidateId || !entry.candidateName) continue;
    const key = entry.date.toISOString().slice(0, 10);
    const day = dayBucket(key);
    day.applications += entry.applicationsCount;
    day.interviews += entry.interviewsCount;
    day.offers += entry.offersCount;
    const c = candidateBucket(day, entry.candidateId, entry.candidateName);
    c.applications += entry.applicationsCount;
    c.interviews += entry.interviewsCount;
    c.offers += entry.offersCount;
  }

  // FR-8.5 — additive to counts derived from logged Application records.
  for (const app of applications) {
    const key = app.appliedDate.toISOString().slice(0, 10);
    const day = dayBucket(key);
    day.applications += 1;
    if (app.status === "INTERVIEW") day.interviews += 1;
    if (app.status === "OFFER") day.offers += 1;
    const c = candidateBucket(day, app.candidateId, app.candidateName);
    c.applications += 1;
    if (app.status === "INTERVIEW") c.interviews += 1;
    if (app.status === "OFFER") c.offers += 1;
  }

  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTotals = byDay.get(todayKey) ?? { applications: 0, interviews: 0, offers: 0 };

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {candidateInfo ? `Reports — ${candidateInfo.name}` : "Daily Reports"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {candidateInfo
          ? "Daily activity log for this candidate."
          : "Org-wide daily activity, combining logged applications and manual report entries."}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Today&apos;s Applications
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground tabular-nums">{todayTotals.applications}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Today&apos;s Interviews
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground tabular-nums">{todayTotals.interviews}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Today&apos;s Offers
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground tabular-nums">{todayTotals.offers}</p>
        </div>
      </div>

      <form className="mt-8 flex flex-wrap items-center gap-2" method="get">
        {candidateId && <input type="hidden" name="candidate" value={candidateId} />}
        {candidateId && (
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground">
            Candidate: {candidateInfo?.name ?? candidateId}
            <Link
              href={
                recruiter || from || to
                  ? `/reports?${new URLSearchParams({ ...(recruiter && { recruiter }), ...(from && { from }), ...(to && { to }) }).toString()}`
                  : "/reports"
              }
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove candidate filter"
            >
              <X className="size-3" />
            </Link>
          </span>
        )}
        <select
          name="recruiter"
          defaultValue={recruiter ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none"
        >
          <option value="">All recruiters</option>
          {recruiters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <DatePicker name="from" defaultValue={from} className="w-40" />
        <span className="text-sm text-muted-foreground">to</span>
        <DatePicker name="to" defaultValue={to} className="w-40" />
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {(recruiter || from || to) && (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={candidateId ? `/reports?candidate=${candidateId}` : "/reports"} />}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No activity logged in this range.
                </TableCell>
              </TableRow>
            )}
            {days.map(([dateKey, totals]) => (
              <TableRow key={dateKey} className="align-top">
                <TableCell className="text-foreground">
                  <details>
                    <summary className="cursor-pointer font-medium">
                      {new Date(dateKey).toLocaleDateString()}
                    </summary>
                    <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                      {[...totals.candidates.values()].map((c, i) => (
                        <li key={i}>
                          {c.name}: {c.applications} applications, {c.interviews} interviews,{" "}
                          {c.offers} offers
                        </li>
                      ))}
                    </ul>
                  </details>
                </TableCell>
                <TableCell className="text-foreground">{totals.applications}</TableCell>
                <TableCell className="text-foreground">{totals.interviews}</TableCell>
                <TableCell className="text-foreground">{totals.offers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
