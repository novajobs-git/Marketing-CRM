-- Checklist links no longer point at a pre-existing candidate — a link now
-- brings a brand-new person INTO the CRM, via the same review-then-approve
-- trust model as the public /intake form (just sent privately to one
-- candidate instead of being a public form). Submission creates a pending
-- intake_submissions row rather than updating a candidate_profiles row.
alter table checklist_links drop column candidate_id;
alter table checklist_links add column resulting_intake_submission_id uuid references intake_submissions(id);

drop function if exists submit_checklist(uuid, jsonb, jsonb, jsonb, jsonb, text, text, text, integer, jsonb);

create function submit_checklist(
  p_link_id uuid,
  p_submitted_data jsonb
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_submission_id uuid;
begin
  if not exists (select 1 from checklist_links where id = p_link_id and status = 'PENDING') then
    raise exception 'Checklist link is not pending';
  end if;

  insert into intake_submissions (submitted_data)
  values (p_submitted_data)
  returning id into v_submission_id;

  update checklist_links
    set status = 'SUBMITTED', submitted_at = now(), resulting_intake_submission_id = v_submission_id
  where id = p_link_id;

  return v_submission_id;
end;
$$;
