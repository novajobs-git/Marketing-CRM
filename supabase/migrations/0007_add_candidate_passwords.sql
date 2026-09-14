-- Admin-only ATS application passwords (e.g. Workday), filled in after a
-- candidate's checklist submission. Plain text by design: these guard
-- disposable job-application email accounts, not the candidate's real
-- identity, and are never exposed on any candidate-facing form.
alter table candidate_profiles add column password_1 text;
alter table candidate_profiles add column password_2 text;
