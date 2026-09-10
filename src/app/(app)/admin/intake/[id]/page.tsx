import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findIntakeSubmissionById } from "@/lib/repo/intake-submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IntakeSubmittedData } from "@/lib/intake";
import {
  VISA_STATUS_OPTIONS,
  YES_NO_OPTIONS,
  GENDER_OPTIONS,
  RACE_OPTIONS,
  VETERAN_STATUS_OPTIONS,
  DISABILITY_STATUS_OPTIONS,
  optionLabel,
} from "@/lib/candidate-fields";
import { approveIntakeSubmission, rejectIntakeSubmission } from "@/app/(app)/admin/intake/actions";

export default async function IntakeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [, { id }] = await Promise.all([requireAdmin(), params]);

  const submission = await findIntakeSubmissionById(createSupabaseServerClient(), id);
  if (!submission) notFound();

  const data = submission.submittedData as unknown as IntakeSubmittedData;

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{data.name}</h1>
          <Badge variant="secondary">{submission.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{data.role}</p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Personal details</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Phone</dt>
              <dd className="text-sm text-foreground">{data.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="text-sm text-foreground">{data.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">DOB</dt>
              <dd className="text-sm text-foreground">
                {data.dob ? new Date(data.dob).toLocaleDateString() : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Address</dt>
              <dd className="text-sm text-foreground">
                {[data.address, data.state, data.zipCode].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Professional details</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">LinkedIn</dt>
              <dd className="text-sm text-foreground">{data.applicationQa.linkedin || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">GitHub</dt>
              <dd className="text-sm text-foreground">{data.applicationQa.github || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Other links</dt>
              <dd className="text-sm text-foreground whitespace-pre-line">
                {data.applicationQa.otherLinks || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Driving Licence</dt>
              <dd className="text-sm text-foreground">
                {optionLabel(YES_NO_OPTIONS, data.applicationQa.drivingLicense)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Visa Status</dt>
              <dd className="text-sm text-foreground">
                {optionLabel(VISA_STATUS_OPTIONS, data.applicationQa.visaStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Salary Expectation</dt>
              <dd className="text-sm text-foreground">{data.applicationQa.salaryExpectation || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Open to Relocate</dt>
              <dd className="text-sm text-foreground">
                {optionLabel(YES_NO_OPTIONS, data.applicationQa.openToRelocate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Resume</dt>
              <dd className="text-sm text-foreground">{data.resume.filename}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Top 5 Skills</dt>
              <dd className="text-sm text-foreground whitespace-pre-line">
                {data.applicationQa.topSkills || "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Job Search Priorities</dt>
              <dd className="text-sm text-foreground whitespace-pre-line">
                {data.applicationQa.jobSearchPriorities || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Education History</h2>
          <div className="mt-3 flex flex-col gap-4">
            {data.educationHistory
              .filter((e) => e.school)
              .map((entry, i) => (
                <dl
                  key={i}
                  className="grid grid-cols-1 gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0 sm:grid-cols-2"
                >
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">School/University</dt>
                    <dd className="text-sm text-foreground">{entry.school}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Degree</dt>
                    <dd className="text-sm text-foreground">{entry.degree || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Major</dt>
                    <dd className="text-sm text-foreground">{entry.major || "—"}</dd>
                  </div>
                </dl>
              ))}
          </div>
        </div>

        <details className="mt-6 rounded-2xl border border-border bg-card p-6">
          <summary className="cursor-pointer text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            EEO information
          </summary>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Race</dt>
              <dd className="text-sm text-foreground">
                {optionLabel(RACE_OPTIONS, data.eeoAnswers.race)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Gender</dt>
              <dd className="text-sm text-foreground">
                {optionLabel(GENDER_OPTIONS, data.eeoAnswers.gender)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Veteran status</dt>
              <dd className="text-sm text-foreground">
                {optionLabel(VETERAN_STATUS_OPTIONS, data.eeoAnswers.veteranStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Disability status</dt>
              <dd className="text-sm text-foreground">
                {optionLabel(DISABILITY_STATUS_OPTIONS, data.eeoAnswers.disabilityStatus)}
              </dd>
            </div>
          </dl>
        </details>

        {submission.status === "PENDING" && (
          <div className="mt-8 flex justify-end gap-2">
            <form action={rejectIntakeSubmission.bind(null, submission.id)}>
              <Button type="submit" variant="outline">
                Reject
              </Button>
            </form>
            <form action={approveIntakeSubmission.bind(null, submission.id)}>
              <Button type="submit">Approve &amp; create profile</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
