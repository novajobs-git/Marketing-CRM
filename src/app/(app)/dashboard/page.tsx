import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listCandidates } from "@/lib/repo/candidates";
import { listRecruitersWithCounts } from "@/lib/repo/users";
import { countApplicationsByCandidate } from "@/lib/repo/applications";
import { Badge } from "@/components/ui/badge";
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

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  UNASSIGNED: "Unassigned",
  ARCHIVED: "Archived",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; recruiter?: string }>;
}) {
  const [session, { q, recruiter }] = await Promise.all([getSession(), searchParams]);
  if (!session) redirect("/login");

  const client = createSupabaseServerClient();

  const [profiles, rollup] = await Promise.all([
    listCandidates(client, {
      excludeStatus: "ARCHIVED",
      assignedRecruiterId: recruiter,
      search: q,
    }),
    session.role === "ADMIN" ? listRecruitersWithCounts(client) : Promise.resolve([]),
  ]);

  const counts = await countApplicationsByCandidate(
    client,
    profiles.map((p) => p.id)
  );

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Welcome, {session.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Candidate profiles across the org, with live application activity.
      </p>

      {session.role === "ADMIN" && rollup.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {rollup.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard?recruiter=${r.id}`}
              className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <p className="text-sm font-medium text-foreground">{r.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.assignedProfileCount} assigned profile
                {r.assignedProfileCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}

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
              <TableHead className="w-[24%]">Candidate</TableHead>
              <TableHead className="w-[14%]">Role</TableHead>
              <TableHead className="w-[20%]">Recruiter</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Interviews</TableHead>
              <TableHead>Assessments</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No candidate profiles match.
                </TableCell>
              </TableRow>
            )}
            {profiles.map((profile) => {
              const c = counts.get(profile.id) ?? {
                applications: 0,
                interviews: 0,
                assessments: 0,
              };
              return (
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
                  <TableCell className="text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-2">
                      {profile.assignedRecruiter && (
                        <InitialsAvatar name={profile.assignedRecruiter.name} />
                      )}
                      <span className="truncate">{profile.assignedRecruiter?.name ?? "Unassigned"}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.applications}</TableCell>
                  <TableCell className="text-muted-foreground">{c.interviews}</TableCell>
                  <TableCell className="text-muted-foreground">{c.assessments}</TableCell>
                  <TableCell>
                    <Badge variant={profile.status === "ACTIVE" ? "success" : "secondary"}>
                      {STATUS_LABEL[profile.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
