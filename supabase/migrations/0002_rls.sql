-- Row Level Security. Clerk's Supabase integration puts the session in a
-- third-party JWT: user id is auth.jwt()->>'sub' (NOT auth.uid(), which only
-- resolves for Supabase's own auth.users and stays null here), and the
-- active Clerk Organization's role comes through as auth.jwt()->'o'->>'rol'
-- ('admin' | 'member') -- only present once an org is active on the session,
-- which Clerk guarantees by the user's *second* session (see Phase 1 notes).
--
-- The two fully-public flows (candidate self-intake, checklist links) are
-- Phase 3 work -- until then, intake_submissions/checklist_* stay admin-only
-- here and those Server Actions keep running against the old Postgres via
-- Prisma, untouched by this migration.

create or replace function is_admin() returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() -> 'o' ->> 'rol') = 'admin', false);
$$;

create or replace function current_user_id() returns text
language sql stable
as $$
  select auth.jwt() ->> 'sub';
$$;

alter table users enable row level security;
alter table candidate_profiles enable row level security;
alter table resume_files enable row level security;
alter table job_descriptions enable row level security;
alter table applications enable row level security;
alter table report_entries enable row level security;
alter table intake_submissions enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_links enable row level security;

-- users: admin sees/manages everyone; a recruiter can read only their own row.
create policy users_select on users for select
  using (is_admin() or id = current_user_id());
create policy users_write on users for all
  using (is_admin()) with check (is_admin());

-- candidate_profiles: a recruiter sees/updates only their assigned candidates;
-- admin has full access; only admins create/delete (matches app-level authz).
create policy candidates_select on candidate_profiles for select
  using (is_admin() or assigned_recruiter_id = current_user_id());
create policy candidates_update on candidate_profiles for update
  using (is_admin() or assigned_recruiter_id = current_user_id())
  with check (is_admin() or assigned_recruiter_id = current_user_id());
create policy candidates_insert on candidate_profiles for insert
  with check (is_admin());
create policy candidates_delete on candidate_profiles for delete
  using (is_admin());

-- resume_files, job_descriptions, applications: always authorized through
-- the parent candidate, mirroring canAccessCandidate() in src/lib/authz.ts.
create policy resume_files_all on resume_files for all
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = resume_files.candidate_id and c.assigned_recruiter_id = current_user_id()
  ))
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = resume_files.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));

create policy job_descriptions_all on job_descriptions for all
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = job_descriptions.candidate_id and c.assigned_recruiter_id = current_user_id()
  ))
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = job_descriptions.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));

create policy applications_all on applications for all
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = applications.candidate_id and c.assigned_recruiter_id = current_user_id()
  ))
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = applications.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));

-- report_entries: candidate-scoped like above; a null candidate_id is an
-- org-wide entry, visible to everyone authenticated (not just admins).
create policy report_entries_all on report_entries for all
  using (
    is_admin()
    or candidate_id is null
    or exists (
      select 1 from candidate_profiles c
      where c.id = report_entries.candidate_id and c.assigned_recruiter_id = current_user_id()
    )
  )
  with check (
    is_admin()
    or candidate_id is null
    or exists (
      select 1 from candidate_profiles c
      where c.id = report_entries.candidate_id and c.assigned_recruiter_id = current_user_id()
    )
  );

-- admin-only tables (public write paths land in Phase 3 via server-side RPCs
-- using the service role, which bypasses RLS -- not a client-side policy).
create policy intake_submissions_admin on intake_submissions for all
  using (is_admin()) with check (is_admin());
create policy checklist_templates_admin on checklist_templates for all
  using (is_admin()) with check (is_admin());
create policy checklist_links_admin on checklist_links for all
  using (is_admin()) with check (is_admin());
