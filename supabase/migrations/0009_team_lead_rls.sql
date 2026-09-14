-- Team Lead RLS: is_team_lead() mirrors is_admin()'s shape but reads the
-- app-level users.is_team_lead flag (not a Clerk org-role claim — see
-- src/lib/authz.ts). Runs with the caller's own privileges; its subquery is
-- itself subject to users_select, which already permits reading one's own
-- row (id = current_user_id()) regardless of admin/team-lead status.
create or replace function is_team_lead() returns boolean
language sql stable
as $$
  select coalesce((select is_team_lead from users where id = current_user_id()), false);
$$;

-- candidate_profiles: team leads can reassign any candidate (FR per
-- src/lib/authz.ts's requireReassignAccess), same as admins. They still
-- cannot create/delete a profile (candidates_insert/candidates_delete,
-- unchanged) or edit any other candidate field beyond assignment — that
-- distinction is enforced at the app layer (the full edit form stays
-- admin-only via proxy.ts), not by this table-level policy.
drop policy candidates_update on candidate_profiles;
create policy candidates_update on candidate_profiles for update
  using (is_admin() or is_team_lead() or assigned_recruiter_id = current_user_id())
  with check (is_admin() or is_team_lead() or assigned_recruiter_id = current_user_id());

-- report_entries: team leads can add reports for any candidate. Editing an
-- existing entry still goes through canEditReportEntry's 8-hour window at
-- the app layer for non-admins (team leads included) — this policy only
-- gates who may write the row at all, not the time window.
drop policy report_entries_insert on report_entries;
create policy report_entries_insert on report_entries for insert
  with check (
    is_admin()
    or is_team_lead()
    or candidate_id is null
    or exists (
      select 1 from candidate_profiles c
      where c.id = report_entries.candidate_id and c.assigned_recruiter_id = current_user_id()
    )
  );

drop policy report_entries_update on report_entries;
create policy report_entries_update on report_entries for update
  using (
    is_admin()
    or is_team_lead()
    or candidate_id is null
    or exists (
      select 1 from candidate_profiles c
      where c.id = report_entries.candidate_id and c.assigned_recruiter_id = current_user_id()
    )
  )
  with check (
    is_admin()
    or is_team_lead()
    or candidate_id is null
    or exists (
      select 1 from candidate_profiles c
      where c.id = report_entries.candidate_id and c.assigned_recruiter_id = current_user_id()
    )
  );
