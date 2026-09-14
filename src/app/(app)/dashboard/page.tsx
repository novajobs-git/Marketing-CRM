import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listCandidates, countCandidatesByStatus } from "@/lib/repo/candidates";
import { listRecruitersWithCounts } from "@/lib/repo/users";
import { countApplicationsByCandidate, listApplicationsFiltered } from "@/lib/repo/applications";
import { listReportEntriesFiltered } from "@/lib/repo/report-entries";
import {
  buildByDayMap,
  buildMonthlyBars,
  buildWeeklyBars,
  computeTodayWeekMonth,
} from "@/lib/report-metrics";
import { formatRelativeTime } from "@/lib/relative-time";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InitialsAvatar } from "@/components/initials-avatar";
import { StatRow } from "@/components/stat-row";
import { ToggleBarChart } from "@/components/toggle-bar-chart";

type SortField = "name" | "role" | "applications" | "interviews" | "lastActivity";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; recruiter?: string; sort?: string; dir?: string }>;
}) {
  const [session, { q, recruiter, sort, dir }] = await Promise.all([getSession(), searchParams]);
  if (!session) redirect("/login");

  const isAdmin = session.role === "ADMIN";
  // Admins can drill into any recruiter's exact dashboard (or "All recruiters",
  // org-wide); a recruiter always sees their own — the query param is theirs
  // to ignore, never a client-trusted scope.
  const effectiveRecruiterId = isAdmin ? recruiter || undefined : session.sub;
  const sortField: SortField = (["name", "role", "applications", "interviews", "lastActivity"] as const).includes(
    sort as SortField
  )
    ? (sort as SortField)
    : "lastActivity";
  const sortDir: "asc" | "desc" = dir === "asc" ? "asc" : "desc";

  const client = createSupabaseServerClient();

  const [profiles, allAssigned, statusCounts, recruiters] = await Promise.all([
    listCandidates(client, { excludeStatus: "ARCHIVED", assignedRecruiterId: effectiveRecruiterId, search: q }),
    // Unfiltered by status — historical activity from an archived candidate
    // still counts toward this scope's application/interview totals, matching
    // the org-wide Daily Reports page's existing convention.
    effectiveRecruiterId ? listCandidates(client, { assignedRecruiterId: effectiveRecruiterId }) : Promise.resolve([]),
    countCandidatesByStatus(client, { assignedRecruiterId: effectiveRecruiterId }),
    isAdmin ? listRecruitersWithCounts(client) : Promise.resolve([]),
  ]);

  const candidateIds = effectiveRecruiterId ? allAssigned.map((c) => c.id) : undefined;
  const now = new Date();

  // Unranged on purpose — the "Total" figures are true all-time counts, and
  // the weekly/monthly bucketing below only ever looks at the current
  // week/month slice of this same dataset, so one fetch covers everything.
  const [counts, applications, reportEntries] = await Promise.all([
    countApplicationsByCandidate(client, profiles.map((p) => p.id)),
    listApplicationsFiltered(client, { candidateIds }),
    listReportEntriesFiltered(client, { candidateIds }),
  ]);

  const byDay = buildByDayMap(applications, reportEntries);
  const applicationsStat = computeTodayWeekMonth(byDay, "applications", now);
  const interviewsStat = computeTodayWeekMonth(byDay, "interviews", now);
  // Applications total is manual-entry only (see buildByDayMap) — a logged
  // Application is a Resume Edit, not necessarily one real submitted
  // application, so it never adds to this count.
  const totalApplications = reportEntries.reduce((sum, e) => sum + e.applicationsCount, 0);
  const totalInterviews =
    applications.filter((a) => a.status === "INTERVIEW").length +
    reportEntries.reduce((sum, e) => sum + e.interviewsCount, 0);
  const totalProfiles = statusCounts.ACTIVE + statusCounts.UNASSIGNED;

  const showRecruiterColumn = isAdmin && !effectiveRecruiterId;

  const rows = profiles.map((profile) => {
    const c = counts.get(profile.id) ?? { applications: 0, interviews: 0, assessments: 0 };
    return { profile, ...c };
  });
  rows.sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") cmp = a.profile.name.localeCompare(b.profile.name);
    else if (sortField === "role") cmp = a.profile.role.localeCompare(b.profile.role);
    else if (sortField === "applications") cmp = a.applications - b.applications;
    else if (sortField === "interviews") cmp = a.interviews - b.interviews;
    else cmp = a.profile.updatedAt.getTime() - b.profile.updatedAt.getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

  function sortHref(field: SortField) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (recruiter) params.set("recruiter", recruiter);
    params.set("sort", field);
    params.set("dir", sortField === field && sortDir === "desc" ? "asc" : "desc");
    return `/dashboard?${params.toString()}`;
  }

  function sortHeader(field: SortField, label: string) {
    const active = sortField === field;
    return (
      <Link href={sortHref(field)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 text-muted-foreground/50" />
        )}
      </Link>
    );
  }

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Welcome, {session.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Candidate profiles across the org, with live application activity.
      </p>

      {isAdmin && (
        <form className="mt-6 flex items-center gap-2" method="get">
          {q && <input type="hidden" name="q" value={q} />}
          <label htmlFor="recruiter" className="text-sm text-muted-foreground">
            Viewing
          </label>
          <select
            id="recruiter"
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
          <Button type="submit" variant="secondary" size="sm">
            View
          </Button>
        </form>
      )}

      <div className="mt-6">
        <StatRow
          segments={[
            { label: "Total applications", value: totalApplications, breakdown: applicationsStat },
            { label: "Total interviews", value: totalInterviews, breakdown: interviewsStat },
            { label: "Total profiles", value: totalProfiles },
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
        {recruiter && <input type="hidden" name="recruiter" value={recruiter} />}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name or role…"
          className="max-w-xs"
        />
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {(q || recruiter) && (
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
            Clear
          </Button>
        )}
      </form>

      <div className="mt-6">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[24%]">{sortHeader("name", "Candidate")}</TableHead>
              <TableHead className="w-[14%]">{sortHeader("role", "Role")}</TableHead>
              {showRecruiterColumn && <TableHead className="w-[18%]">Recruiter</TableHead>}
              <TableHead>{sortHeader("applications", "Applications")}</TableHead>
              <TableHead>{sortHeader("interviews", "Interviews")}</TableHead>
              <TableHead>{sortHeader("lastActivity", "Last activity")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={showRecruiterColumn ? 6 : 5} className="py-10 text-center text-muted-foreground">
                  No candidate profiles match.
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ profile, applications: appCount, interviews }) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/candidates/${profile.id}`} prefetch className="flex min-w-0 items-center gap-2">
                    <InitialsAvatar name={profile.name} />
                    <span className="truncate">{profile.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/candidates/${profile.id}`} prefetch className="flex min-w-0 items-center">
                    <span className="truncate">{profile.role}</span>
                  </Link>
                </TableCell>
                {showRecruiterColumn && (
                  <TableCell className="text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-2">
                      {profile.assignedRecruiter && (
                        <InitialsAvatar name={profile.assignedRecruiter.name} />
                      )}
                      <span className="truncate">{profile.assignedRecruiter?.name ?? "Unassigned"}</span>
                    </span>
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground tabular-nums">{appCount}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{interviews}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelativeTime(profile.updatedAt, now)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
