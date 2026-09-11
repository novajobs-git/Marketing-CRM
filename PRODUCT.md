# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two internal roles at Nova Staffs, a staffing/recruitment agency:

- **Admin**: manages recruiter accounts, creates and edits candidate profiles, assigns/reassigns profiles to recruiters, reviews intake submissions, and views all data and reports org-wide.
- **Recruiter**: works only the candidate profiles assigned to them — logs applications, tracks resume tailoring per application, submits interview/assessment/report activity, and sees only their own book of candidates.

Both roles work inside the CRM daily as their primary work surface, not an occasional tool.

## Product Purpose

Replaces two manual, error-prone workflows at Nova Staffs:

1. Recruiters previously applied to jobs from each candidate's own Gmail account and self-reported activity totals ("Done 20 applications") with no central record.
2. Candidate intake ran through a shared Airtable form disconnected from the rest of the recruiting workflow.

The CRM centralizes candidate profiles, tailored resumes, job descriptions, applications, and reporting into one system of record, so admins can see live activity per recruiter/candidate without asking, and every application has a linked resume version and JD on file.

## Positioning

An internal operations tool, not a market product — built solely for Nova Staffs' own admins and recruiters, with no current intent to license or sell to other agencies. Its mechanism (structured application/JD/resume-version linkage tied to a real assignment/reporting hierarchy) replaces ad hoc Gmail labels and spreadsheet-style self-reporting with one auditable source of truth.

## Operating Context

- Recruiters apply to jobs on a candidate's behalf and paste job descriptions copied from company career pages/job boards — JD formatting (bold, headings, bullet lists, links) must survive the paste.
- Each tailored application bundles a resume PDF version + JD + application record as one atomic unit ("Resume Edits" → "+ Add Application" flow).
- Candidate intake happens two ways: a public, no-login intake form, and admin-defined checklist links that request only a subset of fields from a candidate via a single-use token.
- Reporting happens at two scopes: org-wide daily reports and per-candidate reports, and is both auto-generated (from logged applications) and manually supplementable (end-of-day free-text summaries).
- EEO/application Q&A fields mirror the org's real Airtable intake form fields and option sets (race, gender, veteran status, disability status, all with a decline-to-answer option) — this field set is compliance-sensitive and should not be casually altered.

## Capabilities and Constraints

- Auth: email + password, JWT session, two roles (Admin/Recruiter). Recruiters are server-side scoped to their assigned candidate profiles only.
- Resumes are PDF only; job descriptions are structured rich text (Tiptap/ProseMirror JSON), never a file — this keeps JD content searchable/editable and avoids storing raw HTML.
- Application status lifecycle: Applied, Interview, Assessment, Offer, Rejected, Withdrawn.
- Candidate profile status lifecycle: Active, Unassigned (from intake), Archived (soft delete — historical application data is preserved).
- File storage is S3-compatible object storage (MinIO locally); DB stores metadata + object key only.
- Out of scope for v1: automatic Gmail label detection (planned future phase, same data model), direct outreach/communication with hiring companies, payroll/invoicing/billing.
- Open/undecided at the product level: whether recruiters can edit core profile fields (name, address, EEO answers) themselves versus admin-only; whether report entries are editable/deletable after submission or append-only.

## Brand Commitments

- Product/company name: **Nova Staffs**. Logo asset already in use (`public/nova-staffs-logo.png`), currently shown on the login and public checklist-link pages.
- The app's visual identity should carry Nova Staffs branding throughout — not just a logo on the login screen — while remaining an internal operations tool, not a marketing surface.
- No accessibility standard is currently required; use sensible defaults without treating a specific standard (e.g. WCAG AA) as a hard requirement.

## Evidence on Hand

- Full PRD/FRD/UI/tech-stack spec at `recruitment-crm-prd-frd-ui-techstack.md` (repo root) — authoritative source for functional requirements and the original UI direction document.
- Build plan at `claude-code-build-prompt.md` (repo root).
- Real candidate intake field set and options extracted from the org's live Airtable form (see `src/lib/candidate-fields.ts`).
- Seeded demo data (`prisma/seed.ts`): 1 admin, 3 recruiters (2 active, 1 inactive), 8 candidate profiles, 2 pending intake submissions with generated sample resume PDFs — useful as realistic fixture content, not real candidate data.
- No customer testimonials, case studies, or press exist or should be fabricated; this is an internal tool with no external audience.

## Product Principles

- One system of record: every application must carry a linked resume version and JD — no orphaned or self-reported activity.
- Role-scoped by default: recruiters see and act only on their own assigned candidates; admins see everything.
- Structured over freeform where it matters: JD content and EEO/application answers stay structured (rich text JSON / typed fields), not opaque blobs, so they remain searchable, editable, and compliant.
- Archival, not deletion, is the default for candidate profiles — historical application data must survive status changes.
- Manual reporting supplements, never replaces, activity generated automatically by real logged applications.
