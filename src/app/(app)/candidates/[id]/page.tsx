import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCandidateById } from "@/lib/repo/candidates";
import { listResumeFilesForCandidate } from "@/lib/repo/resume-files";
import { listApplicationsForCandidate } from "@/lib/repo/applications";
import { listReportEntriesForCandidate } from "@/lib/repo/report-entries";
import { canAccessCandidate } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  VISA_STATUS_OPTIONS,
  YES_NO_OPTIONS,
  GENDER_OPTIONS,
  RACE_OPTIONS,
  VETERAN_STATUS_OPTIONS,
  DISABILITY_STATUS_OPTIONS,
  optionLabel,
  type EeoAnswers,
  type ProfessionalDetails,
  type EducationEntry,
} from "@/lib/candidate-fields";
import { ArchiveProfileButton } from "@/components/archive-profile-button";
import { AddReportDialog } from "@/components/add-report-dialog";
import { CopyButton } from "@/components/copy-button";
import { Plus } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  UNASSIGNED: "Unassigned",
  ARCHIVED: "Archived",
};

const APPLICATION_STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  ASSESSMENT: "Assessment",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { tab } = await searchParams;

  const client = createSupabaseServerClient();
  const candidate = await findCandidateById(client, id);
  if (!candidate) notFound();
  if (!canAccessCandidate(session, candidate)) redirect("/dashboard");

  const [resumeFiles, applications, reportEntries] = await Promise.all([
    listResumeFilesForCandidate(client, id),
    listApplicationsForCandidate(client, id),
    listReportEntriesForCandidate(client, id),
  ]);

  const eeo = candidate.eeoAnswers as EeoAnswers | null;
  const qa = candidate.applicationQa as ProfessionalDetails | null;
  const education = (candidate.educationHistory as EducationEntry[] | null) ?? [];
  const baseResumes = resumeFiles.filter((r) => !r.isTailoredVersion);

  const activeTab = ["details", "resume-edits", "reports"].includes(tab ?? "")
    ? tab!
    : "details";

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {candidate.name}
              </h1>
              <Badge variant={candidate.status === "ARCHIVED" ? "outline" : "secondary"}>
                {STATUS_LABEL[candidate.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{candidate.role}</p>
          </div>
          {session.role === "ADMIN" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/candidates/${candidate.id}/edit`} />}
              >
                Edit
              </Button>
              <ArchiveProfileButton
                candidateId={candidate.id}
                isArchived={candidate.status === "ARCHIVED"}
              />
            </div>
          )}
        </div>

        <Tabs defaultValue={activeTab} className="mt-8">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="resume-edits">Resume Edits</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsIndicator />
          </TabsList>

          <TabsContent value="details" className="mt-6 flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Personal details</h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="group">
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-foreground">
                    {candidate.phone || "—"}
                    {candidate.phone && <CopyButton value={candidate.phone} />}
                  </dd>
                </div>
                <div className="group">
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-foreground">
                    {candidate.email || "—"}
                    {candidate.email && <CopyButton value={candidate.email} />}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">DOB</dt>
                  <dd className="text-sm text-foreground">
                    {candidate.dob ? candidate.dob.toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Assigned recruiter</dt>
                  <dd className="text-sm text-foreground">
                    {candidate.assignedRecruiter?.name ?? "Unassigned"}
                  </dd>
                </div>
                <div className="group sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-foreground">
                    {(() => {
                      const fullAddress = [candidate.address, candidate.state, candidate.zipCode]
                        .filter(Boolean)
                        .join(", ");
                      return (
                        <>
                          {fullAddress || "—"}
                          {fullAddress && <CopyButton value={fullAddress} />}
                        </>
                      );
                    })()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Professional details</h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="group">
                  <dt className="text-xs text-muted-foreground">LinkedIn</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-foreground">
                    {qa?.linkedin || "—"}
                    {qa?.linkedin && <CopyButton value={qa.linkedin} />}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Driving Licence</dt>
                  <dd className="text-sm text-foreground">
                    {optionLabel(YES_NO_OPTIONS, qa?.drivingLicense)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Visa Status</dt>
                  <dd className="text-sm text-foreground">
                    {optionLabel(VISA_STATUS_OPTIONS, qa?.visaStatus)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">EAD End Date</dt>
                  <dd className="text-sm text-foreground">{qa?.eadEndDate || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Salary Expectation</dt>
                  <dd className="text-sm text-foreground">{qa?.salaryExpectation || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Open to Relocate</dt>
                  <dd className="text-sm text-foreground">
                    {optionLabel(YES_NO_OPTIONS, qa?.openToRelocate)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Top 5 Skills</dt>
                  <dd className="text-sm text-foreground whitespace-pre-line">{qa?.topSkills || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Certifications</dt>
                  <dd className="text-sm text-foreground whitespace-pre-line">
                    {qa?.certifications || "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Preferred Cities/States</dt>
                  <dd className="text-sm text-foreground whitespace-pre-line">
                    {qa?.preferredCitiesStates || "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Job Search Priorities</dt>
                  <dd className="text-sm text-foreground whitespace-pre-line">
                    {qa?.jobSearchPriorities || "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Resume</h2>
              {baseResumes.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">No resume on file.</p>
              )}
              <ul className="mt-3 flex flex-col gap-2">
                {baseResumes.map((resume) => (
                  <li key={resume.id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{resume.filename}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<a href={`/api/resumes/${resume.id}`} target="_blank" rel="noreferrer" />}
                    >
                      View PDF
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Education History</h2>
              {education.filter((e) => e.school).length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">No education on file.</p>
              )}
              <div className="mt-3 flex flex-col gap-4">
                {education
                  .filter((e) => e.school)
                  .map((entry, i) => (
                    <dl key={i} className="grid grid-cols-1 gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0 sm:grid-cols-2">
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
                      <div>
                        <dt className="text-xs text-muted-foreground">GPA</dt>
                        <dd className="text-sm text-foreground">{entry.gpa || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Dates</dt>
                        <dd className="text-sm text-foreground">
                          {entry.startDate || "—"} – {entry.endDate || "—"}
                        </dd>
                      </div>
                    </dl>
                  ))}
              </div>
            </div>

            <details className="rounded-2xl border border-border bg-card p-6">
              <summary className="cursor-pointer text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                EEO information
              </summary>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Race</dt>
                  <dd className="text-sm text-foreground">{optionLabel(RACE_OPTIONS, eeo?.race)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Gender</dt>
                  <dd className="text-sm text-foreground">{optionLabel(GENDER_OPTIONS, eeo?.gender)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Veteran status</dt>
                  <dd className="text-sm text-foreground">
                    {optionLabel(VETERAN_STATUS_OPTIONS, eeo?.veteranStatus)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Disability status</dt>
                  <dd className="text-sm text-foreground">
                    {optionLabel(DISABILITY_STATUS_OPTIONS, eeo?.disabilityStatus)}
                  </dd>
                </div>
              </dl>
            </details>
          </TabsContent>

          <TabsContent value="resume-edits" className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Every tailored resume + job description pair logged for this candidate.
              </p>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href={`/candidates/${candidate.id}/applications/new`} />}
              >
                <Plus />
                Add Application
              </Button>
            </div>

            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Job description</TableHead>
                    <TableHead>Resume</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        No applications logged yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="text-muted-foreground">
                        <Link
                          href={`/candidates/${candidate.id}/applications/${app.id}`}
                          className="block"
                        >
                          {app.appliedDate.toLocaleDateString()}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <Link
                          href={`/candidates/${candidate.id}/applications/${app.id}`}
                          className="block"
                        >
                          {app.jobDescription.sourceNote || "Untitled"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Link
                          href={`/candidates/${candidate.id}/applications/${app.id}`}
                          className="block"
                        >
                          {app.resumeFile.filename}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/candidates/${candidate.id}/applications/${app.id}`}
                          className="block"
                        >
                          <Badge variant="secondary">{APPLICATION_STATUS_LABEL[app.status]}</Badge>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Daily activity log for this candidate.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/reports?candidate=${candidate.id}`} />}
                >
                  View full reports
                </Button>
                <AddReportDialog candidateId={candidate.id} />
              </div>
            </div>

            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Interviews</TableHead>
                    <TableHead>Offers</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No report entries yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {reportEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground">
                        {entry.date.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-foreground">{entry.applicationsCount}</TableCell>
                      <TableCell className="text-foreground">{entry.interviewsCount}</TableCell>
                      <TableCell className="text-foreground">{entry.offersCount}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {entry.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
