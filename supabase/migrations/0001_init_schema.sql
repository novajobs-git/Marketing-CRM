-- Phase 2: full schema rebuild on Supabase, mirroring prisma/schema.prisma
-- (kept as the historical reference; Prisma itself is retired once the app's
-- data-access layer is fully swapped to the repo layer). IDs use
-- gen_random_uuid() instead of Prisma's client-side cuid(); users.id stays
-- the Clerk user id (text, no default) since identity was already re-keyed
-- in Phase 1. resume_files.uploaded_by_id gets a real FK here, fixing the
-- orphaned soft-reference that existed under Prisma.

create extension if not exists pgcrypto;

create type user_role as enum ('ADMIN', 'RECRUITER');
create type user_status as enum ('ACTIVE', 'INACTIVE');
create type profile_status as enum ('ACTIVE', 'UNASSIGNED', 'ARCHIVED');
create type application_status as enum ('APPLIED', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'REJECTED', 'WITHDRAWN');
create type intake_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type checklist_link_status as enum ('PENDING', 'SUBMITTED', 'EXPIRED');

create table users (
  id text primary key,
  name text not null,
  email text not null unique,
  role user_role not null,
  status user_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  address text,
  state text,
  zip_code text,
  phone text,
  email text,
  dob date,
  status profile_status not null default 'UNASSIGNED',
  eeo_answers jsonb,
  application_qa jsonb,
  education_history jsonb,
  assigned_recruiter_id text references users(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on candidate_profiles (assigned_recruiter_id);

create table resume_files (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidate_profiles(id) on delete cascade,
  storage_key text not null,
  filename text not null,
  mime_type text not null default 'application/pdf',
  size_bytes integer not null,
  is_tailored_version boolean not null default false,
  uploaded_by_id text references users(id),
  uploaded_at timestamptz not null default now()
);
create index on resume_files (candidate_id);

create table job_descriptions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidate_profiles(id) on delete cascade,
  content jsonb not null,
  source_note text,
  created_at timestamptz not null default now()
);
create index on job_descriptions (candidate_id);

create table applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidate_profiles(id) on delete cascade,
  resume_file_id uuid not null references resume_files(id),
  job_description_id uuid not null unique references job_descriptions(id),
  status application_status not null default 'APPLIED',
  applied_date timestamptz not null default now(),
  created_by_id text not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on applications (candidate_id);
create index on applications (status);

create table report_entries (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  date date not null,
  applications_count integer not null default 0,
  interviews_count integer not null default 0,
  offers_count integer not null default 0,
  notes text,
  created_by_id text not null references users(id),
  created_at timestamptz not null default now()
);
create index on report_entries (candidate_id);
create index on report_entries (date);

create table intake_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_data jsonb not null,
  status intake_status not null default 'PENDING',
  resulting_profile_id uuid unique references candidate_profiles(id),
  reviewed_by_id text references users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  field_keys jsonb not null,
  created_by_id text not null references users(id),
  created_at timestamptz not null default now()
);

create table checklist_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  template_id uuid not null references checklist_templates(id),
  candidate_id uuid not null references candidate_profiles(id) on delete cascade,
  status checklist_link_status not null default 'PENDING',
  submitted_data jsonb,
  created_by_id text not null references users(id),
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index on checklist_links (token);
create index on checklist_links (candidate_id);
