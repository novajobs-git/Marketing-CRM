# Recruitment CRM — PRD, FRD, UI Design & Tech Stack

**Version:** 1.0 — MVP scope (manual labeling)
**Prepared:** August 28, 2026

---

## Table of contents

1. [Product Requirements Document (PRD)](#1-product-requirements-document-prd)
2. [Functional Requirements Document (FRD)](#2-functional-requirements-document-frd)
3. [UI Design Document](#3-ui-design-document)
4. [Technical Stack Document](#4-technical-stack-document)
5. [Assumptions & Open Questions](#5-assumptions--open-questions)
6. [Future Phase: Automatic Label Detection](#6-future-phase-automatic-label-detection)

---

## 1. Product Requirements Document (PRD)

### 1.1 Background

Recruiters currently source and apply to jobs on behalf of candidates using each candidate's own Gmail account. Application confirmations and interview invites are manually sorted into Gmail labels ("Applications", "Interview"), and recruiters self-report totals manually (e.g. "Done 20 applications"). Candidate intake is currently handled through a shared Airtable form.

This creates three problems: application activity is not centrally trackable, resumes and job descriptions are not stored against a structured record, and there is no single place to see a candidate's history of tailored resumes, applications, interviews, and assessments.

### 1.2 Goals

- Give admins a single system to manage recruiters, candidate profiles, and profile assignment.
- Give recruiters a single place to log applications, interviews, and assessments per candidate profile, replacing manual self-reporting.
- Store resumes (PDF) and job descriptions (formatted text) against each application, including tailored resume versions.
- Replace the Airtable-based intake with a native form that writes directly into the CRM.
- Provide daily and historical reporting, both system-wide and per candidate.

### 1.3 Out of scope (v1)

- Automatic detection of Gmail label changes. All application/interview/assessment logging is done manually inside the CRM in v1; Gmail label automation is planned for a later phase (see [Section 6](#6-future-phase-automatic-label-detection)).
- Any direct outreach or communication with hiring companies — recruiters only apply on behalf of candidates.
- Payroll, invoicing, or candidate billing.

### 1.4 User roles

| Role | Description | Key permissions |
|---|---|---|
| **Admin** | Manages the org, recruiters, and candidate profiles. | Add/remove users, assign profiles to recruiters, create/edit profiles, view all data and reports. |
| **Recruiter** | Applies to jobs on behalf of assigned candidate profiles. | View assigned profiles only, log applications/interviews/assessments, manage resume tailoring, submit candidate reports. |

### 1.5 Success metrics

- 100% of applications logged inside the CRM instead of self-reported totals.
- Admins can view any recruiter's live application/interview/assessment counts without asking them directly.
- Every application record has a linked resume version and JD on file.

---

## 2. Functional Requirements Document (FRD)

### 2.1 Authentication & roles

| ID | Requirement |
|---|---|
| FR-1.1 | Users log in with email + password. Two roles: Admin, Recruiter. |
| FR-1.2 | Recruiters can only see and act on candidate profiles assigned to them by an admin. |
| FR-1.3 | Admins can see all profiles, all recruiters, and all reports across the org. |

### 2.2 Admin: user management

| ID | Requirement |
|---|---|
| FR-2.1 | Admin can add a new recruiter account (name, email, temp password / invite link). |
| FR-2.2 | Admin can remove or deactivate a recruiter account. Deactivating retains historical data; deleting is a separate, confirmed action. |
| FR-2.3 | Admin can view a list of all recruiters with their assigned profile count and activity summary. |
| FR-2.4 | Admin can assign or reassign one or more candidate profiles to a recruiter. |

### 2.3 Admin: candidate profile management

A "profile" represents one candidate the agency is finding jobs for.

| ID | Requirement |
|---|---|
| FR-3.1 | Admin can create a new candidate profile with: Name, Role (target job title), Address, Resume (PDF upload), and job-application-related answers including EEO fields (race/ethnicity, gender, veteran status, disability status — all with a "decline to answer" option). |
| FR-3.2 | Admin can edit any field on an existing profile. |
| FR-3.3 | Admin can view a profile's full detail page: personal details, resume(s), EEO/application Q&A, assigned recruiter, and activity history. |
| FR-3.4 | Admin can archive a profile (soft delete) without losing historical application data. |

### 2.4 Candidate intake form (replaces Airtable)

| ID | Requirement |
|---|---|
| FR-4.1 | A native, CRM-hosted form lets a candidate submit: personal details, target role, address, resume upload (PDF), and standard job-application questions including EEO. |
| FR-4.2 | On submission, the form creates a new candidate profile in the CRM directly (status: "Unassigned"), visible to admins for review and recruiter assignment. |
| FR-4.3 | Admin can review submitted intake records before they become active, editable profiles. |

### 2.5 Job description (JD) management

| ID | Requirement |
|---|---|
| FR-5.1 | JD is entered as rich text, not plain text. When a recruiter pastes a JD copied from a job posting, the CRM's rich text editor preserves source formatting (bold, headings, bullet lists, links) rather than flattening it to plain text. |
| FR-5.2 | Each JD is saved as its own record and linked to one application (and, transitively, to whichever resume version was tailored for it). |
| FR-5.3 | JD text is stored in a structured rich-text format (not a scanned image or PDF), so it remains searchable and editable. |

### 2.6 Resume tailoring & application flow

This is the core recruiter workflow. Navigation: **Candidates → open a candidate → Resume Edits tab → list of previous edits → "+ Add Application" button**.

| ID | Requirement |
|---|---|
| FR-6.1 | From a candidate profile, a recruiter opens the "Resume Edits" tab, showing a chronological list of every past tailored resume + JD pair for that candidate (date, JD title/company if known, resume filename). |
| FR-6.2 | A "+ Add Application" button (top corner of the Resume Edits tab) opens a form to log a new tailored application in one step: upload/attach the tailored resume PDF, paste the JD (rich text, formatting preserved), and set the application date/status. |
| FR-6.3 | Submitting "+ Add Application" creates one linked record: resume version + JD + application entry, and immediately reflects in that candidate's and that recruiter's dashboard counts. |
| FR-6.4 | Recruiters can open any past resume edit to view the exact tailored resume and JD that were used for that specific application. |
| FR-6.5 | Each application record has a status field: Applied, Interview, Assessment, Offer, Rejected, Withdrawn — updatable by the recruiter as it progresses. |

### 2.7 Recruiter dashboard

| ID | Requirement |
|---|---|
| FR-7.1 | Dashboard lists all candidate profiles assigned to the logged-in recruiter (or, for admins, filterable across all recruiters). |
| FR-7.2 | Each profile row shows live counts: total Applications, Interviews, and Assessments. |
| FR-7.3 | Clicking a profile opens its full detail page (profile info, Resume Edits tab, Reports tab). |
| FR-7.4 | Admin view of the dashboard additionally shows per-recruiter roll-up totals. |

### 2.8 Reports

| ID | Requirement |
|---|---|
| FR-8.1 | A daily reports section logs, per day, the total Applications, Interviews, and Offers across the org (or filtered by recruiter). |
| FR-8.2 | Each candidate profile page has its own "Reports" tab with the same structure, scoped to that candidate. |
| FR-8.3 | Recruiters can manually add a report entry against a candidate, capturing: date, applications count, interviews count, offers count, and free-text notes. |
| FR-8.4 | A "View full reports" option opens a log view listing every past day's entries (org-wide or per candidate), sortable/filterable by date range. |
| FR-8.5 | Report entries are additive to, not a replacement for, the counts generated automatically by logged applications (Section 2.6) — manual entries are for activity not yet captured as a structured application record, e.g. a quick end-of-day summary note. |

---

## 3. UI Design Document

### 3.1 Information architecture

```
Login
Recruiter Dashboard (home)          — list of assigned candidate profiles with live counts
  Candidate Profile page
    Details tab                     — name, role, address, EEO/application Q&A, resume file
    Resume Edits tab                — list of tailored resume/JD pairs, + Add Application button
    Reports tab                     — per-candidate report log, add report entry
Daily Reports (global)              — org-wide daily log, full reports view
Admin Console
  User Management                  — add/remove recruiters, assign profiles
  Profile Management               — create/edit candidate profiles, review intake submissions
Candidate Intake Form               — public/shared form, writes directly into the CRM
```

### 3.2 Key screens

**Recruiter Dashboard**
- Table/card list of assigned candidate profiles.
- Columns: Candidate name, Role, Applications count, Interviews count, Assessments count, Last activity date.
- Filter/search bar by candidate name or role.
- Row click → opens Candidate Profile page.

**Candidate Profile — Details tab**
- Header: candidate name, role, assigned recruiter, status badge.
- Fields: Address, Resume (download/preview PDF), application Q&A block, EEO section (collapsed by default, admin/recruiter can expand).
- Edit button (admin only, or recruiter for limited fields per FR-2.x).

**Candidate Profile — Resume Edits tab**
- "+ Add Application" button, top-right corner.
- List/table of past resume edits: date, JD title/company, status badge, view link.
- Clicking an entry opens a read-only detail view showing the tailored resume (PDF preview) side-by-side with the JD (rendered rich text).

**+ Add Application modal / page**
- Resume upload field (PDF).
- JD field — rich text editor with paste-and-preserve-formatting behavior, plus a basic formatting toolbar (bold, headings, bullets, links).
- Application date field (defaults to today).
- Status dropdown: Applied / Interview / Assessment / Offer / Rejected / Withdrawn.
- Save button — creates the linked resume + JD + application record and returns to the Resume Edits list.

**Candidate Profile — Reports tab**
- "Add report" button — opens a small form: date, applications, interviews, offers, notes.
- Table of past entries for this candidate, most recent first.
- "View full reports" link — opens the full log (see Daily Reports below), pre-filtered to this candidate.

**Daily Reports (global)**
- Summary cards at top: today's totals (Applications, Interviews, Offers) across the org or filtered recruiter.
- Log table below: one row per day, columns Applications / Interviews / Offers, expandable to see contributing candidates.
- Date range filter and recruiter filter.

**Admin — User Management**
- Table of recruiters: name, email, status (active/inactive), number of assigned profiles.
- "Add recruiter" button — form with name, email, send invite.
- Row actions: reassign profiles, deactivate, remove.

**Admin — Profile Management**
- Table of all candidate profiles: name, role, assigned recruiter, status (Active/Unassigned from intake/Archived).
- "Add profile" button — manual creation form matching FR-3.1 fields.
- Pending intake submissions shown in a distinct "Needs review" section for admin approval.

**Candidate Intake Form (public)**
- Simple multi-section form: personal details, target role, address, resume upload, application Q&A, EEO (with decline-to-answer options clearly available).
- Confirmation screen on submit; no login required for the candidate.

### 3.3 UI component notes

- **Rich text editor**: needs paste-formatting preservation (not just plain-text paste) — see [Section 4.3](#43-formatting-preserved-jd-paste).
- **PDF viewer**: inline preview for resumes, no forced download.
- **Status badges**: consistent color coding across dashboard, profile, and reports views (Applied/Interview/Assessment/Offer/Rejected/Withdrawn).
- **Tables**: should support sort and basic filter on every list screen (dashboard, user management, profile management, reports).

---

## 4. Technical Stack Document

### 4.1 Overview

Standard web application stack: a relational database for structured records, object storage for files, a REST(ish) backend API, and a React-based frontend. No Gmail integration is required for v1 since labeling stays manual (see [Section 6](#6-future-phase-automatic-label-detection) for the planned phase 2 addition).

### 4.2 Suggested stack

| Layer | Recommendation | Notes |
|---|---|---|
| Frontend | React (Next.js) | Single app serving both recruiter/admin UI and the public candidate intake form. |
| Backend | Node.js (NestJS) or Python (FastAPI) | Either fits; pick based on team familiarity. REST API. |
| Database | PostgreSQL | Relational data fits well: profiles → applications → resume versions → JDs → reports. |
| File storage | AWS S3 / Cloudflare R2 / GCS | Resume PDFs stored as objects; DB stores only metadata + object key. |
| Rich text editor | Tiptap (ProseMirror-based) | Needed for JD paste-and-keep-formatting (Section 4.3) and report notes. |
| Auth | JWT session-based, role claims (Admin/Recruiter) | Recruiter queries scoped server-side to assigned profile IDs only. |
| File type handling | PDF for resumes only; JD is structured rich text (JSON or HTML), never a file | Keeps JD searchable/editable, per FR-5.3. |
| Hosting | Any standard cloud (AWS/GCP/Render/Fly.io) | No special infra needs for v1 — no background job queue required yet since there's no Gmail polling. |

### 4.3 Formatting-preserved JD paste

When a recruiter copies a JD from a company careers page or job board and pastes it into the CRM, the source HTML formatting (bold, headings, bullet lists) should carry over instead of collapsing to plain text.

- Use a ProseMirror/Tiptap-based editor with paste-rule handling for HTML clipboard content, which is the standard approach for this behavior in web apps.
- Store the result as structured content (Tiptap/ProseMirror JSON, or sanitized HTML) rather than plain text, so formatting is preserved on redisplay and edits.
- Sanitize pasted HTML server-side (strip scripts/styles from external sources) before saving.

### 4.4 Core data model

| Table | Key fields |
|---|---|
| `users` | id, name, email, role (admin/recruiter), status (active/inactive) |
| `candidate_profiles` | id, name, role, address, resume_file_id, assigned_recruiter_id, status (active/unassigned/archived), eeo_answers (json), application_qa (json) |
| `resume_files` | id, candidate_id, storage_key, filename, uploaded_at, is_tailored_version (bool) |
| `job_descriptions` | id, candidate_id, application_id, content (rich text json/html), source_note |
| `applications` | id, candidate_id, resume_file_id, job_description_id, status, applied_date, created_by (recruiter) |
| `report_entries` | id, candidate_id (nullable for org-wide), date, applications_count, interviews_count, offers_count, notes, created_by |
| `intake_submissions` | id, submitted_data (json), status (pending/approved), created_at |

### 4.5 Notes on deferred scope

The architecture leaves room for the phase 2 Gmail auto-detection work discussed previously (polling or Pub/Sub push against candidate mailboxes) without changing the core data model — automated detection would simply create the same application/JD/resume records that the "+ Add Application" flow creates manually today.

---

## 5. Assumptions & Open Questions

- Can recruiters edit core profile fields (Name, Address, EEO answers) themselves, or is that admin-only? Assumed admin-only for EEO/legal fields in this draft — confirm.
- Should the candidate intake form require any verification (e.g. email confirmation) before creating a profile, or is admin review sufficient gatekeeping?
- Do report entries need to be editable/deletable after submission, or are they an append-only log for audit purposes?
- Resume file size/format limits (assumed PDF only, per your spec).

---

## 6. Future Phase: Automatic Label Detection

Once the manual workflow above is validated, Gmail label changes (Applications / Interview / Assessment) can be detected automatically — either via scheduled polling (every 5 minutes, as discussed) or Gmail API push notifications — to auto-create the same application records instead of requiring the "+ Add Application" step. This is additive and does not require changes to the data model in Section 4.4.
