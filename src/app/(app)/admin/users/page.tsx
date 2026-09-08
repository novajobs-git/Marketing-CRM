import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listRecruitersWithCounts, countRecruitersByStatus, type UserStatus } from "@/lib/repo/users";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddRecruiterDialog } from "@/components/add-recruiter-dialog";
import { RecruiterRowActions } from "@/components/recruiter-row-actions";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ViewsNav } from "@/components/views-nav";

const VIEWS = [
  { key: "all", label: "All recruiters" },
  { key: "ACTIVE", label: "Active" },
  { key: "INACTIVE", label: "Inactive" },
] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const { view: rawView } = await searchParams;
  const activeView = VIEWS.find((v) => v.key === rawView)?.key ?? "all";

  const client = createSupabaseServerClient();
  const [recruiters, statusCounts] = await Promise.all([
    listRecruitersWithCounts(client, activeView !== "all" ? { status: activeView as UserStatus } : {}),
    countRecruitersByStatus(client),
  ]);

  const countByStatus = new Map(Object.entries(statusCounts));
  const totalCount = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <ViewsNav
        views={VIEWS.map((v) => ({
          key: v.key,
          label: v.label,
          count: v.key === "all" ? totalCount : (countByStatus.get(v.key) ?? 0),
        }))}
        activeKey={activeView}
        hrefFor={(key) => (key === "all" ? "/admin/users" : `/admin/users?view=${key}`)}
      />

      <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Recruiters</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage recruiter accounts and see their assigned profile counts.
            </p>
          </div>
          <AddRecruiterDialog />
        </div>

        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned profiles</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recruiters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No recruiters match.
                  </TableCell>
                </TableRow>
              )}
              {recruiters.map((recruiter) => (
                <TableRow key={recruiter.id}>
                  <TableCell className="font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <InitialsAvatar name={recruiter.name} />
                      {recruiter.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{recruiter.email}</TableCell>
                  <TableCell>
                    <Badge variant={recruiter.status === "ACTIVE" ? "secondary" : "outline"}>
                      {recruiter.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Link
                      href={`/admin/profiles?recruiter=${recruiter.id}`}
                      className="underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {recruiter.assignedProfileCount}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <RecruiterRowActions
                      userId={recruiter.id}
                      status={recruiter.status}
                      assignedCount={recruiter.assignedProfileCount}
                      otherRecruiters={recruiters
                        .filter((r) => r.id !== recruiter.id && r.status === "ACTIVE")
                        .map((r) => ({ id: r.id, name: r.name }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
