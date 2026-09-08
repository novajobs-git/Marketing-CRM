import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { countRecruiters } from "@/lib/repo/users";
import { countActiveCandidates } from "@/lib/repo/candidates";
import { countChecklistTemplates } from "@/lib/repo/checklists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  await requireAdmin();
  const client = createSupabaseServerClient();

  const [recruiterCount, profileCount, templateCount] = await Promise.all([
    countRecruiters(client),
    countActiveCandidates(client),
    countChecklistTemplates(client),
  ]);

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin console</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage recruiters and candidate profiles.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/admin/users">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                User management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {recruiterCount} recruiter{recruiterCount === 1 ? "" : "s"} — add, deactivate, or
                remove accounts.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/profiles">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Profile management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {profileCount} active profile{profileCount === 1 ? "" : "s"} — create, edit, and
                assign candidates.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/checklists">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Checklists</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {templateCount} template{templateCount === 1 ? "" : "s"} — send one-time public
                links to candidates.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-border p-6">
        <h2 className="text-base font-semibold text-foreground">Candidate application form</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this link with candidates — no login required. Submissions show up under
          &quot;Needs review&quot; in Profile management.
        </p>
        <Link
          href="/intake"
          target="_blank"
          className="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
        >
          /intake
        </Link>
      </div>
    </div>
  );
}
