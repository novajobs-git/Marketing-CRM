import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileStatus = "ACTIVE" | "UNASSIGNED" | "ARCHIVED";

export type CandidateProfile = {
  id: string;
  name: string;
  role: string;
  address: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  dob: Date | null;
  status: ProfileStatus;
  eeoAnswers: Record<string, unknown> | null;
  applicationQa: Record<string, unknown> | null;
  educationHistory: unknown[] | null;
  assignedRecruiterId: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CandidateWithRecruiter = CandidateProfile & { assignedRecruiter: { id: string; name: string } | null };

type CandidateRow = {
  id: string;
  name: string;
  role: string;
  address: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  dob: string | null;
  status: ProfileStatus;
  eeo_answers: Record<string, unknown> | null;
  application_qa: Record<string, unknown> | null;
  education_history: unknown[] | null;
  assigned_recruiter_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_recruiter?: { id: string; name: string } | null;
};

function throwIfError<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data;
}

function mapCandidate(row: CandidateRow): CandidateWithRecruiter {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    address: row.address,
    state: row.state,
    zipCode: row.zip_code,
    phone: row.phone,
    email: row.email,
    dob: row.dob ? new Date(row.dob) : null,
    status: row.status,
    eeoAnswers: row.eeo_answers,
    applicationQa: row.application_qa,
    educationHistory: row.education_history,
    assignedRecruiterId: row.assigned_recruiter_id,
    archivedAt: row.archived_at ? new Date(row.archived_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    assignedRecruiter: row.assigned_recruiter ?? null,
  };
}

function escapeForOr(q: string) {
  return q.replace(/[%_,()]/g, "");
}

export type CandidateFilters = {
  status?: ProfileStatus;
  excludeStatus?: ProfileStatus;
  assignedRecruiterId?: string;
  search?: string;
};

export async function listCandidates(
  client: SupabaseClient,
  filters: CandidateFilters,
  opts: { orderBy?: "updatedAt" | "createdAt" } = {}
): Promise<CandidateWithRecruiter[]> {
  let query = client
    .from("candidate_profiles")
    .select("*, assigned_recruiter:users!candidate_profiles_assigned_recruiter_id_fkey(id, name)")
    .order(opts.orderBy === "createdAt" ? "created_at" : "updated_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.excludeStatus) query = query.neq("status", filters.excludeStatus);
  if (filters.assignedRecruiterId) query = query.eq("assigned_recruiter_id", filters.assignedRecruiterId);
  if (filters.search) {
    const q = escapeForOr(filters.search.trim());
    if (q) query = query.or(`name.ilike.%${q}%,role.ilike.%${q}%`);
  }

  const res = await query;
  const data = throwIfError(res as never) as CandidateRow[];
  return data.map(mapCandidate);
}

export async function countCandidatesByStatus(
  client: SupabaseClient,
  filters: { assignedRecruiterId?: string } = {}
): Promise<Record<ProfileStatus, number>> {
  let query = client.from("candidate_profiles").select("status");
  if (filters.assignedRecruiterId) query = query.eq("assigned_recruiter_id", filters.assignedRecruiterId);
  const res = await query;
  const data = throwIfError(res as never) as { status: ProfileStatus }[];
  const counts: Record<ProfileStatus, number> = { ACTIVE: 0, UNASSIGNED: 0, ARCHIVED: 0 };
  for (const row of data) counts[row.status]++;
  return counts;
}

export async function countActiveCandidates(client: SupabaseClient): Promise<number> {
  const res = await client.from("candidate_profiles").select("id", { count: "exact", head: true }).neq("status", "ARCHIVED");
  const result = res as unknown as { count: number | null; error: { message: string; code?: string } | null };
  if (result.error) throw Object.assign(new Error(result.error.message), { code: result.error.code });
  return result.count ?? 0;
}

export async function findCandidateById(
  client: SupabaseClient,
  id: string
): Promise<CandidateWithRecruiter | null> {
  const res = await client
    .from("candidate_profiles")
    .select("*, assigned_recruiter:users!candidate_profiles_assigned_recruiter_id_fkey(id, name)")
    .eq("id", id)
    .maybeSingle();
  const data = throwIfError(res as never) as CandidateRow | null;
  return data ? mapCandidate(data) : null;
}

export type CandidateWriteFields = {
  name: string;
  role: string;
  phone: string;
  email: string;
  dob: Date;
  address: string;
  state: string;
  zipCode: string;
  eeoAnswers: Record<string, unknown>;
  applicationQa: Record<string, unknown>;
  educationHistory: unknown;
};

function toRow(fields: CandidateWriteFields) {
  return {
    name: fields.name,
    role: fields.role,
    phone: fields.phone,
    email: fields.email,
    dob: fields.dob.toISOString().slice(0, 10),
    address: fields.address,
    state: fields.state,
    zip_code: fields.zipCode,
    eeo_answers: fields.eeoAnswers,
    application_qa: fields.applicationQa,
    education_history: fields.educationHistory,
  };
}

export async function updateCandidate(
  client: SupabaseClient,
  id: string,
  fields: CandidateWriteFields,
  extra: { status: ProfileStatus; assignedRecruiterId: string | null }
): Promise<void> {
  const res = await client
    .from("candidate_profiles")
    .update({ ...toRow(fields), status: extra.status, assigned_recruiter_id: extra.assignedRecruiterId })
    .eq("id", id);
  throwIfError(res as never);
}

export async function archiveCandidate(client: SupabaseClient, id: string): Promise<void> {
  const res = await client
    .from("candidate_profiles")
    .update({ status: "ARCHIVED", archived_at: new Date().toISOString() })
    .eq("id", id);
  throwIfError(res as never);
}

export async function unarchiveCandidate(client: SupabaseClient, id: string): Promise<void> {
  const candidate = await findCandidateById(client, id);
  if (!candidate) return;
  const res = await client
    .from("candidate_profiles")
    .update({ status: candidate.assignedRecruiterId ? "ACTIVE" : "UNASSIGNED", archived_at: null })
    .eq("id", id);
  throwIfError(res as never);
}

export async function bulkArchiveCandidates(client: SupabaseClient, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const res = await client
    .from("candidate_profiles")
    .update({ status: "ARCHIVED", archived_at: new Date().toISOString() })
    .in("id", ids);
  throwIfError(res as never);
}

/** Moves every non-archived profile from one recruiter to another (or unassigns), e.g. before deactivating a recruiter. */
export async function reassignAllProfiles(
  client: SupabaseClient,
  fromRecruiterId: string,
  toRecruiterId: string | null
): Promise<void> {
  const nonArchived = await client
    .from("candidate_profiles")
    .update({ assigned_recruiter_id: toRecruiterId, status: toRecruiterId ? "ACTIVE" : "UNASSIGNED" })
    .eq("assigned_recruiter_id", fromRecruiterId)
    .neq("status", "ARCHIVED");
  throwIfError(nonArchived as never);

  const archived = await client
    .from("candidate_profiles")
    .update({ assigned_recruiter_id: toRecruiterId })
    .eq("assigned_recruiter_id", fromRecruiterId)
    .eq("status", "ARCHIVED");
  throwIfError(archived as never);
}

export async function bulkReassignCandidates(
  client: SupabaseClient,
  ids: string[],
  recruiterId: string | null
): Promise<void> {
  if (ids.length === 0) return;
  const nonArchived = await client
    .from("candidate_profiles")
    .update({ assigned_recruiter_id: recruiterId, status: recruiterId ? "ACTIVE" : "UNASSIGNED" })
    .in("id", ids)
    .neq("status", "ARCHIVED");
  throwIfError(nonArchived as never);

  const archived = await client
    .from("candidate_profiles")
    .update({ assigned_recruiter_id: recruiterId })
    .in("id", ids)
    .eq("status", "ARCHIVED");
  throwIfError(archived as never);
}
