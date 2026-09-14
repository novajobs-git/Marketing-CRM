import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCandidateById } from "@/lib/repo/candidates";
import { listResumeFilesForCandidate } from "@/lib/repo/resume-files";
import { listApplicationsForCandidate } from "@/lib/repo/applications";
import { listReportEntriesForCandidate } from "@/lib/repo/report-entries";
import { canAccessCandidate, canManageReportsForCandidate } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { DeleteResumeFileButton } from "@/components/delete-resume-file-button";
import { AddReportDialog } from "@/components/add-report-dialog";
import { EditReportDialog } from "@/components/edit-report-dialog";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { canEditReportEntry } from "@/lib/authz";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  UNASSIGNED: "Unassigned",
  ARCHIVED: "Archived",
};

/** One label/value pair on the details tab — bold label, normal-weight value,
 * with a copy button that appears on hover whenever there's a real value to copy. */
function FieldRow({
  label,
  value,
  multiline = false,
  emptyText = "—",
  className,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
  emptyText?: string;
  className?: string;
}) {
  const hasValue = Boolean(value && value.trim() && value !== "—");
  return (
    <div className={cn("group", className)}>
      <dt className="text-sm font-bold text-foreground">{label}</dt>
      <dd
        className={cn(
          "flex gap-1.5 text-xs font-normal text-foreground",
          multiline ? "items-start whitespace-pre-line" : "items-center"
        )}
      >
        <span>{hasValue ? value : emptyText}</span>
        {hasValue && <CopyButton value={value as string} />}
      </dd>
    </div>
  );
}

const APPLICATION_STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  ASSESSMENT: "Assessment",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const RESUME_EDITS_PAGE_SIZE = 10;

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const [session, { id }, { tab, q, page }] = await Promise.all([getSession(), params, searchParams]);
  if (!session) redirect("/login");

  const client = createSupabaseServerClient();
  const candidate = await findCandidateById(client, id);
  if (!candidate) notFound();
  // Every recruiter can view every profile; logging activity (applications,
  // reports) against it stays scoped to admins/the assigned recruiter.
  const canManage = canAccessCandidate(session, candidate);
  // Reports specifically are also open to team leads for any candidate, not
  // just their own assigned ones — see canManageReportsForCandidate.
  const canManageReports = canManageReportsForCandidate(session, candidate);

  const [resumeFiles, applications, reportEntries] = await Promise.all([
    listResumeFilesForCandidate(client, id),
    listApplicationsForCandidate(client, id),
    listReportEntriesForCandidate(client, id),
  ]);

  const eeo = candidate.eeoAnswers as EeoAnswers | null;
  const qa = candidate.applicationQa as ProfessionalDetails | null;
  const education = (candidate.educationHistory as EducationEntry[] | null) ?? [];
  const baseResumes = resumeFiles.filter((r) => !r.isTailoredVersion);
  // The Resume Edits tab's total is a literal count of the rows in that
  // section (tailored resume/JD pairs) — distinct from the Reports/dashboard
  // "Total applications" figure, which is manual-entry only (report_entries),
  // never resume-edit rows. Two different numbers, on purpose.
  const totalApplications = applications.length;

  const activeTab = ["details", "resume-edits", "reports"].includes(tab ?? "")
    ? tab!
    : "details";

  const resumeEditsQuery = (q ?? "").trim().toLowerCase();
  const filteredApplications = resumeEditsQuery
    ? applications.filter(
        (app) =>
          (app.jobDescription.sourceNote ?? "").toLowerCase().includes(resumeEditsQuery) ||
          app.resumeFile.filename.toLowerCase().includes(resumeEditsQuery)
      )
    : applications;
  const resumeEditsTotalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / RESUME_EDITS_PAGE_SIZE)
  );
  const resumeEditsPage = Math.min(
    Math.max(1, parseInt(page ?? "1", 10) || 1),
    resumeEditsTotalPages
  );
  const pagedApplications = filteredApplications.slice(
    (resumeEditsPage - 1) * RESUME_EDITS_PAGE_SIZE,
    resumeEditsPage * RESUME_EDITS_PAGE_SIZE
  );

  function resumeEditsHref(targetPage: number) {
    const params = new URLSearchParams({ tab: "resume-edits" });
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("page", String(targetPage));
    return `/candidates/${id}?${params.toString()}`;
  }

  // Caps the numbered-page row at 7 slots (first, last, current ±2, "…"
  // fillers) so a candidate with dozens of resume edits doesn't produce an
  // unbounded row of page buttons.
  function resumeEditsPageNumbers(current: number, total: number): (number | "ellipsis")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, total, current, current - 1, current - 2, current + 1, current + 2]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const result: (number | "ellipsis")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) result.push("ellipsis");
      result.push(sorted[i]!);
    }
    return result;
  }

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {candidate.name}
              </h1>
              <Badge
                variant={
                  candidate.status === "ACTIVE"
                    ? "success"
                    : candidate.status === "ARCHIVED"
                      ? "outline"
                      : "secondary"
                }
              >
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
                <FieldRow label="Phone" value={candidate.phone} />
                <FieldRow label="Email" value={candidate.email} />
                <FieldRow label="DOB" value={candidate.dob ? candidate.dob.toLocaleDateString() : null} />
                <FieldRow
                  label="Assigned recruiter"
                  value={candidate.assignedRecruiter?.name}
                  emptyText="Unassigned"
                />
                <FieldRow
                  label="Address"
                  value={[candidate.address, candidate.state, candidate.zipCode].filter(Boolean).join(", ")}
                />
                <FieldRow label="LinkedIn" value={qa?.linkedin} />
              </dl>

              {session.role === "ADMIN" && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    ATS Application Passwords
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Default passwords for signing into job-application portals (e.g. Workday) for this candidate.
                  </p>
                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FieldRow label="Password 1" value={candidate.password1} />
                    <FieldRow label="Password 2" value={candidate.password2} />
                  </dl>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Professional details</h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldRow label="Driving Licence" value={optionLabel(YES_NO_OPTIONS, qa?.drivingLicense)} />
                <FieldRow label="Visa Status" value={optionLabel(VISA_STATUS_OPTIONS, qa?.visaStatus)} />
                <FieldRow label="EAD End Date" value={qa?.eadEndDate} />
                <FieldRow label="Salary Expectation" value={qa?.salaryExpectation} />
                <FieldRow label="Open to Relocate" value={optionLabel(YES_NO_OPTIONS, qa?.openToRelocate)} />
                <FieldRow label="Top 5 Skills" value={qa?.topSkills} multiline className="sm:col-span-2" />
                <FieldRow label="Certifications" value={qa?.certifications} multiline className="sm:col-span-2" />
                <FieldRow
                  label="Preferred Cities/States"
                  value={qa?.preferredCitiesStates}
                  multiline
                  className="sm:col-span-2"
                />
                <FieldRow
                  label="Job Search Priorities"
                  value={qa?.jobSearchPriorities}
                  multiline
                  className="sm:col-span-2"
                />
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Resume</h2>
              {baseResumes.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">No resume on file.</p>
              )}
              <ul className="mt-3 flex flex-col gap-2">
                {baseResumes.map((resume) => (
                  <li key={resume.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-foreground">{resume.filename}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={<a href={`/api/resumes/${resume.id}`} target="_blank" rel="noreferrer" />}
                      >
                        View PDF
                      </Button>
                      {session.role === "ADMIN" && (
                        <DeleteResumeFileButton
                          resumeFileId={resume.id}
                          candidateId={candidate.id}
                          filename={resume.filename}
                        />
                      )}
                    </div>
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
                      <FieldRow label="School/University" value={entry.school} className="sm:col-span-2" />
                      <FieldRow label="Degree" value={entry.degree} />
                      <FieldRow label="Major" value={entry.major} />
                      <FieldRow label="GPA" value={entry.gpa} />
                      <FieldRow
                        label="Dates"
                        value={
                          entry.startDate || entry.endDate
                            ? `${entry.startDate || "—"} – ${entry.endDate || "—"}`
                            : null
                        }
                      />
                    </dl>
                  ))}
              </div>
            </div>

            <details className="rounded-2xl border border-border bg-card p-6">
              <summary className="cursor-pointer text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                EEO information
              </summary>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldRow label="Race" value={optionLabel(RACE_OPTIONS, eeo?.race)} />
                <FieldRow label="Gender" value={optionLabel(GENDER_OPTIONS, eeo?.gender)} />
                <FieldRow label="Veteran status" value={optionLabel(VETERAN_STATUS_OPTIONS, eeo?.veteranStatus)} />
                <FieldRow
                  label="Disability status"
                  value={optionLabel(DISABILITY_STATUS_OPTIONS, eeo?.disabilityStatus)}
                />
              </dl>
            </details>
          </TabsContent>

          <TabsContent value="resume-edits" className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Every tailored resume + job description pair logged for this candidate.
              </p>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Total applications
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {totalApplications}
                  </p>
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/candidates/${candidate.id}/applications/new`} />}
                  >
                    <Plus />
                    Add Application
                  </Button>
                )}
              </div>
            </div>

            <form className="mt-4 flex items-center gap-2" method="get">
              <input type="hidden" name="tab" value="resume-edits" />
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search job description or resume filename…"
                  className="w-72 pl-8"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
              {q && (
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/candidates/${id}?tab=resume-edits`} />}
                >
                  Clear
                </Button>
              )}
            </form>

            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[18%]">Date</TableHead>
                    <TableHead className="w-[38%]">Job description</TableHead>
                    <TableHead className="w-[28%]">Resume</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedApplications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        {resumeEditsQuery ? "No applications match your search." : "No applications logged yet."}
                      </TableCell>
                    </TableRow>
                  )}
                  {pagedApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="text-muted-foreground">
                        <Link
                          href={`/candidates/${candidate.id}/applications/${app.id}`}
                          prefetch
                          className="block"
                        >
                          {app.appliedDate.toLocaleDateString()}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <Link
                          href={`/candidates/${candidate.id}/applications/${app.id}`}
                          prefetch
                          className="block truncate"
                        >
                          {app.jobDescription.sourceNote || "Untitled"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Link
                          href={`/candidates/${candidate.id}/applications/${app.id}`}
                          prefetch
                          className="block truncate"
                        >
                          {app.resumeFile.filename}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/candidates/${candidate.id}/applications/${app.id}`}
                          prefetch
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

            {filteredApplications.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {(resumeEditsPage - 1) * RESUME_EDITS_PAGE_SIZE + 1}–
                  {Math.min(resumeEditsPage * RESUME_EDITS_PAGE_SIZE, filteredApplications.length)} of{" "}
                  {filteredApplications.length}
                </p>
                {resumeEditsTotalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {resumeEditsPage === 1 ? (
                      <Button variant="ghost" size="icon-sm" disabled aria-label="Previous page">
                        <ChevronLeft />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        nativeButton={false}
                        render={<Link href={resumeEditsHref(resumeEditsPage - 1)} aria-label="Previous page" />}
                      >
                        <ChevronLeft />
                      </Button>
                    )}
                    {resumeEditsPageNumbers(resumeEditsPage, resumeEditsTotalPages).map((p, i) =>
                      p === "ellipsis" ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === resumeEditsPage ? "default" : "ghost"}
                          size="icon-sm"
                          nativeButton={false}
                          render={<Link href={resumeEditsHref(p)} />}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    {resumeEditsPage === resumeEditsTotalPages ? (
                      <Button variant="ghost" size="icon-sm" disabled aria-label="Next page">
                        <ChevronRight />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        nativeButton={false}
                        render={<Link href={resumeEditsHref(resumeEditsPage + 1)} aria-label="Next page" />}
                      >
                        <ChevronRight />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
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
                  render={<Link href={`/candidates/${candidate.id}/reports`} />}
                >
                  View full reports
                </Button>
                {canManageReports && <AddReportDialog candidateId={candidate.id} />}
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
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
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
                      <TableCell>
                        {canEditReportEntry(session, candidate, entry) && (
                          <EditReportDialog entry={entry} candidateId={candidate.id} />
                        )}
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
