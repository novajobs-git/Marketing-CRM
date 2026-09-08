import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listRecruiters } from "@/lib/repo/users";
import { CandidateProfileForm } from "@/components/candidate-profile-form";
import { createCandidateProfile } from "@/app/(app)/candidates/actions";

export default async function NewCandidatePage() {
  await requireAdmin();

  const recruiters = await listRecruiters(createSupabaseServerClient(), { status: "ACTIVE" });

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          New candidate profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a candidate record with resume, EEO answers, and application Q&amp;A.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <CandidateProfileForm
            action={createCandidateProfile}
            recruiters={recruiters}
            submitLabel="Create profile"
          />
        </div>
      </div>
    </div>
  );
}
