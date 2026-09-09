-- Every recruiter can now VIEW every candidate profile (not just their
-- assigned ones) — but writing (editing a candidate, creating/updating an
-- application, logging a report entry) stays scoped to admins or the
-- recruiter actually assigned to that candidate. This splits the previous
-- combined "FOR ALL" policies into an open SELECT policy plus the original
-- assignment-scoped policies for INSERT/UPDATE/DELETE.

drop policy candidates_select on candidate_profiles;
create policy candidates_select on candidate_profiles for select
  using (true);
-- candidates_update/insert/delete are unchanged (admin or assigned recruiter).

drop policy resume_files_all on resume_files;
create policy resume_files_select on resume_files for select using (true);
create policy resume_files_insert on resume_files for insert
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = resume_files.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));
create policy resume_files_update on resume_files for update
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = resume_files.candidate_id and c.assigned_recruiter_id = current_user_id()
  ))
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = resume_files.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));
create policy resume_files_delete on resume_files for delete
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = resume_files.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));

drop policy job_descriptions_all on job_descriptions;
create policy job_descriptions_select on job_descriptions for select using (true);
create policy job_descriptions_insert on job_descriptions for insert
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = job_descriptions.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));
create policy job_descriptions_update on job_descriptions for update
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = job_descriptions.candidate_id and c.assigned_recruiter_id = current_user_id()
  ))
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = job_descriptions.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));
create policy job_descriptions_delete on job_descriptions for delete
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = job_descriptions.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));

drop policy applications_all on applications;
create policy applications_select on applications for select using (true);
create policy applications_insert on applications for insert
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = applications.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));
create policy applications_update on applications for update
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = applications.candidate_id and c.assigned_recruiter_id = current_user_id()
  ))
  with check (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = applications.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));
create policy applications_delete on applications for delete
  using (is_admin() or exists (
    select 1 from candidate_profiles c
    where c.id = applications.candidate_id and c.assigned_recruiter_id = current_user_id()
  ));

-- report_entries: viewing stays open to everyone (part of full profile
-- visibility); creating/editing a report entry stays scoped to admin, the
-- assigned recruiter, or an org-wide (candidate_id null) entry.
drop policy report_entries_all on report_entries;
create policy report_entries_select on report_entries for select using (true);
create policy report_entries_insert on report_entries for insert
  with check (
    is_admin()
    or candidate_id is null
    or exists (
      select 1 from candidate_profiles c
      where c.id = report_entries.candidate_id and c.assigned_recruiter_id = current_user_id()
    )
  );
create policy report_entries_update on report_entries for update
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
create policy report_entries_delete on report_entries for delete
  using (
    is_admin()
    or candidate_id is null
    or exists (
      select 1 from candidate_profiles c
      where c.id = report_entries.candidate_id and c.assigned_recruiter_id = current_user_id()
    )
  );
