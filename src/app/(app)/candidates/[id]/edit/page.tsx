import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCandidateById } from "@/lib/repo/candidates";
import { listResumeFilesForCandidate } from "@/lib/repo/resume-files";
import { listRecruiters } from "@/lib/repo/users";
import { CandidateProfileForm } from "@/components/candidate-profile-form";
import { updateCandidateProfile } from "@/app/(app)/candidates/actions";
import { candidateToFormDefaults } from "@/lib/candidate-form-schema";

export default async function EditCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [, { id }] = await Promise.all([requireAdmin(), params]);

  const client = createSupabaseServerClient();
  const [candidate, recruiters] = await Promise.all([
    findCandidateById(client, id),
    listRecruiters(client, { status: "ACTIVE" }),
  ]);

  if (!candidate) notFound();

  const baseResumes = await listResumeFilesForCandidate(client, candidate.id, { baseOnly: true, limit: 1 });

  const boundAction = updateCandidateProfile.bind(null, candidate.id);

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Edit {candidate.name}
        </h1>

        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <CandidateProfileForm
            action={boundAction}
            recruiters={recruiters}
            submitLabel="Save changes"
            defaultAssignedRecruiterId={candidate.assignedRecruiterId ?? undefined}
            defaultValues={{
              ...candidateToFormDefaults(candidate),
              existingResumeFilename: baseResumes[0]?.filename,
            }}
          />
        </div>
      </div>
    </div>
  );
}
