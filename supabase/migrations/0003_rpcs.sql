-- Atomic multi-table writes. supabase-js has no client-side transaction API,
-- so each of these is a single plpgsql function call (implicitly one
-- transaction — if any statement fails, the whole thing rolls back).
-- security invoker (the default) so RLS still applies per-statement using
-- the caller's own JWT/role — no privilege escalation beyond what the
-- calling Server Action already checked at the app layer.

create or replace function create_application(
  p_candidate_id uuid,
  p_storage_key text,
  p_filename text,
  p_mime_type text,
  p_size_bytes integer,
  p_uploaded_by_id text,
  p_jd_content jsonb,
  p_source_note text,
  p_status application_status,
  p_applied_date timestamptz,
  p_created_by_id text
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_resume_file_id uuid;
  v_job_description_id uuid;
  v_application_id uuid;
begin
  insert into resume_files (candidate_id, storage_key, filename, mime_type, size_bytes, is_tailored_version, uploaded_by_id)
  values (p_candidate_id, p_storage_key, p_filename, p_mime_type, p_size_bytes, true, p_uploaded_by_id)
  returning id into v_resume_file_id;

  insert into job_descriptions (candidate_id, content, source_note)
  values (p_candidate_id, p_jd_content, p_source_note)
  returning id into v_job_description_id;

  insert into applications (candidate_id, resume_file_id, job_description_id, status, applied_date, created_by_id)
  values (p_candidate_id, v_resume_file_id, v_job_description_id, p_status, p_applied_date, p_created_by_id)
  returning id into v_application_id;

  return v_application_id;
end;
$$;

-- Public flow (no Clerk session at all) — called via the service-role client,
-- which bypasses RLS at the Postgres role level regardless of security mode.
create or replace function approve_intake_submission(
  p_submission_id uuid,
  p_name text, p_role text, p_phone text, p_email text, p_dob date,
  p_address text, p_state text, p_zip_code text,
  p_eeo_answers jsonb, p_application_qa jsonb, p_education_history jsonb,
  p_resume_storage_key text, p_resume_filename text, p_resume_mime_type text, p_resume_size_bytes integer,
  p_reviewed_by_id text
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_candidate_id uuid;
begin
  insert into candidate_profiles (name, role, phone, email, dob, address, state, zip_code, status, eeo_answers, application_qa, education_history)
  values (p_name, p_role, p_phone, p_email, p_dob, p_address, p_state, p_zip_code, 'UNASSIGNED', p_eeo_answers, p_application_qa, p_education_history)
  returning id into v_candidate_id;

  insert into resume_files (candidate_id, storage_key, filename, mime_type, size_bytes, is_tailored_version)
  values (v_candidate_id, p_resume_storage_key, p_resume_filename, p_resume_mime_type, p_resume_size_bytes, false);

  update intake_submissions
    set status = 'APPROVED', resulting_profile_id = v_candidate_id, reviewed_by_id = p_reviewed_by_id, reviewed_at = now()
    where id = p_submission_id and status = 'PENDING';

  return v_candidate_id;
end;
$$;

-- Public flow (no Clerk session) — candidate self-service via a checklist
-- link. p_top_level/p_application_qa/p_eeo_answers/p_education_history carry
-- ONLY the keys the template actually requested, so untouched fields on the
-- candidate row are left alone (coalesce against the existing value).
create or replace function submit_checklist(
  p_link_id uuid,
  p_top_level jsonb,
  p_application_qa jsonb,
  p_eeo_answers jsonb,
  p_education_history jsonb,
  p_resume_storage_key text, p_resume_filename text, p_resume_mime_type text, p_resume_size_bytes integer,
  p_submitted_data jsonb
) returns void
language plpgsql
security invoker
as $$
declare
  v_candidate_id uuid;
begin
  select candidate_id into v_candidate_id from checklist_links where id = p_link_id and status = 'PENDING';
  if v_candidate_id is null then
    raise exception 'Checklist link is not pending';
  end if;

  update candidate_profiles set
    name = coalesce(p_top_level->>'name', name),
    phone = coalesce(p_top_level->>'phone', phone),
    email = coalesce(p_top_level->>'email', email),
    dob = coalesce((p_top_level->>'dob')::date, dob),
    address = coalesce(p_top_level->>'address', address),
    state = coalesce(p_top_level->>'state', state),
    zip_code = coalesce(p_top_level->>'zipCode', zip_code),
    application_qa = coalesce(p_application_qa, application_qa),
    eeo_answers = coalesce(p_eeo_answers, eeo_answers),
    education_history = coalesce(p_education_history, education_history)
  where id = v_candidate_id;

  if p_resume_storage_key is not null then
    insert into resume_files (candidate_id, storage_key, filename, mime_type, size_bytes, is_tailored_version)
    values (v_candidate_id, p_resume_storage_key, p_resume_filename, p_resume_mime_type, p_resume_size_bytes, false);
  end if;

  update checklist_links set status = 'SUBMITTED', submitted_at = now(), submitted_data = p_submitted_data
  where id = p_link_id;
end;
$$;
