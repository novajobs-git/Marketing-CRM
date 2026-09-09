import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listCandidates, countCandidatesByStatus, type ProfileStatus } from "@/lib/repo/candidates";
import { findUserById, listRecruiters } from "@/lib/repo/users";
import { listPendingIntakeSubmissions } from "@/lib/repo/intake-submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IntakeSubmittedData } from "@/lib/intake";
import { ProfilesTable } from "@/components/profiles-table";
import { ViewsNav } from "@/components/views-nav";

const VIEWS = [
  { key: "all", label: "All profiles" },
  { key: "ACTIVE", label: "Active" },
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "ARCHIVED", label: "Archived" },
] as const;

export default async function AdminProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; recruiter?: string }>;
}) {
  await requireAdmin();
  const { q, recruiter, view: rawView } = await searchParams;
  const activeView = VIEWS.find((v) => v.key === rawView)?.key ?? "all";

  const client = createSupabaseServerClient();

  const [profiles, recruiterFilterUser, pendingIntakes, statusCounts, activeRecruiters] =
    await Promise.all([
      listCandidates(
        client,
        {
          assignedRecruiterId: recruiter,
          status: activeView !== "all" ? (activeView as ProfileStatus) : undefined,
          search: q,
        },
        { orderBy: "createdAt" }
      ),
      recruiter ? findUserById(client, recruiter) : null,
      listPendingIntakeSubmissions(client),
      countCandidatesByStatus(client, { assignedRecruiterId: recruiter }),
      listRecruiters(client, { status: "ACTIVE" }),
    ]);

  const countByStatus = new Map(Object.entries(statusCounts));
  const totalCount = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  function viewHref(key: string) {
    const params = new URLSearchParams();
    if (key !== "all") params.set("view", key);
    if (recruiter) params.set("recruiter", recruiter);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/profiles?${qs}` : "/admin/profiles";
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <ViewsNav
        views={VIEWS.map((v) => ({
          key: v.key,
          label: v.label,
          count: v.key === "all" ? totalCount : (countByStatus.get(v.key) ?? 0),
        }))}
        activeKey={activeView}
        hrefFor={viewHref}
      />

      <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Candidate profiles
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {recruiterFilterUser
                ? `Showing profiles assigned to ${recruiterFilterUser.name}.`
                : "All candidate profiles across the org."}
            </p>
          </div>
          <Button size="sm" nativeButton={false} render={<Link href="/admin/checklists" />}>
            <Plus />
            Add candidate
          </Button>
        </div>

        {pendingIntakes.length > 0 && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">
              Needs review — {pendingIntakes.length} pending intake
              {pendingIntakes.length === 1 ? "" : "s"}
            </h2>
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {pendingIntakes.map((submission) => {
                const data = submission.submittedData as unknown as IntakeSubmittedData;
                return (
                  <li key={submission.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{data.name}</p>
                      <p className="text-xs text-muted-foreground">{data.role}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/intake/${submission.id}`} />}
                    >
                      Review
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <form className="mt-6 flex flex-wrap items-center gap-2" method="get">
          {activeView !== "all" && <input type="hidden" name="view" value={activeView} />}
          {recruiter && (
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground">
              Recruiter: {recruiterFilterUser?.name ?? recruiter}
              <Link
                href={viewHref(activeView)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Remove recruiter filter"
              >
                <X className="size-3" />
              </Link>
            </span>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by name or role…"
              className="w-64 pl-8"
            />
          </div>
          {q && (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={viewHref(activeView)} />}>
              Clear search
            </Button>
          )}
        </form>

        <div className="mt-6">
          <ProfilesTable profiles={profiles} recruiters={activeRecruiters} />
        </div>
      </div>
    </div>
  );
}
