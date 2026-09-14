-- Team Lead: an app-level flag layered on top of a RECRUITER's normal Clerk
-- org role (not a new Clerk org role) — grants org-wide report add/view
-- access and candidate-recruiter reassignment, without admin's add-candidate,
-- approve/reject-intake, or delete rights. See src/lib/authz.ts.
alter table users add column is_team_lead boolean not null default false;
