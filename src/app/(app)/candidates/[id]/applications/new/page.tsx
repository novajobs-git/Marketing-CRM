import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCandidateById } from "@/lib/repo/candidates";
import { canAccessCandidate } from "@/lib/authz";
import { AddApplicationForm } from "@/components/add-application-form";
import { createApplication } from "@/app/(app)/candidates/[id]/applications/actions";

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getSession(), params]);
  if (!session) redirect("/login");

  const candidate = await findCandidateById(createSupabaseServerClient(), id);
  if (!candidate) notFound();
  if (!canAccessCandidate(session, candidate)) redirect("/dashboard");

  const boundAction = createApplication.bind(null, candidate.id);

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Add application — {candidate.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload the tailored resume and paste in the job description.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <AddApplicationForm action={boundAction} />
        </div>
      </div>
    </div>
  );
}
