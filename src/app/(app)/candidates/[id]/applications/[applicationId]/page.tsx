import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findApplicationById } from "@/lib/repo/applications";
import { canAccessCandidate } from "@/lib/authz";
import { ApplicationStatusSelect } from "@/components/application-status-select";
import { Badge } from "@/components/ui/badge";
import { JdViewer } from "@/components/jd-editor";
import type { JSONContent } from "@tiptap/react";

const APPLICATION_STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  ASSESSMENT: "Assessment",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const [session, { id, applicationId }] = await Promise.all([getSession(), params]);
  if (!session) redirect("/login");

  const application = await findApplicationById(createSupabaseServerClient(), applicationId);
  if (!application || application.candidateId !== id) notFound();
  // Every recruiter can view every application; changing its status stays
  // scoped to admins/the assigned recruiter.
  const canManage = canAccessCandidate(session, application.candidate);

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
          {canManage ? (
            <ApplicationStatusSelect applicationId={application.id} status={application.status} />
          ) : (
            <Badge variant="secondary">{APPLICATION_STATUS_LABEL[application.status]}</Badge>
          )}
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
