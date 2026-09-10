-- Performance audit: adds indexes for columns hit by WHERE/ORDER BY clauses
-- in src/lib/repo/*.ts that had no index coverage, and drops one duplicate
-- index left over from 0001 (checklist_links.token is already covered by
-- its own unique constraint).

create index if not exists idx_applications_applied_date on applications (applied_date);
create index if not exists idx_applications_candidate_applied_date on applications (candidate_id, applied_date desc);

create index if not exists idx_candidate_profiles_updated_at on candidate_profiles (updated_at desc);
create index if not exists idx_candidate_profiles_created_at on candidate_profiles (created_at desc);
create index if not exists idx_candidate_profiles_status_updated_at on candidate_profiles (status, updated_at desc);

create index if not exists idx_checklist_links_template_id on checklist_links (template_id);
create index if not exists idx_checklist_links_created_at on checklist_links (created_at desc);

create index if not exists idx_intake_submissions_status_created_at on intake_submissions (status, created_at asc);

create index if not exists idx_resume_files_candidate_tailored_uploaded
  on resume_files (candidate_id, is_tailored_version, uploaded_at desc);

create index if not exists idx_report_entries_candidate_date on report_entries (candidate_id, date desc);

create index if not exists idx_users_role_name on users (role, name asc);

-- Redundant duplicate of the unique constraint on checklist_links.token (0001
-- L119 unique + L128 explicit index on the same column).
drop index if exists checklist_links_token_idx;
