import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findApplicationById } from "@/lib/repo/applications";
import { canAccessCandidate } from "@/lib/authz";
import { ApplicationStatusSelect } from "@/components/application-status-select";
import { JdViewer } from "@/components/jd-editor";
import type { JSONContent } from "@tiptap/react";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, applicationId } = await params;

  const application = await findApplicationById(createSupabaseServerClient(), applicationId);
  if (!application || application.candidateId !== id) notFound();
  if (!canAccessCandidate(session, application.candidate)) redirect("/dashboard");

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href={`/candidates/${id}?tab=resume-edits`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to {application.candidate.name}
      </Link>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {application.jobDescription.sourceNote || "Application"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Applied {application.appliedDate.toLocaleDateString()} · {application.resumeFile.filename}
          </p>
        </div>
        <div className="w-40">
          <ApplicationStatusSelect applicationId={application.id} status={application.status} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tailored resume</h2>
          <iframe
            src={`/api/resumes/${application.resumeFile.id}`}
            className="h-[70vh] w-full rounded-lg border border-border"
            title="Tailored resume"
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Job description</h2>
          <JdViewer content={application.jobDescription.content as JSONContent} />
        </div>
      </div>
    </div>
  );
}
