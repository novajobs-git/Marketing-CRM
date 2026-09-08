import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ApplicationStatus = "APPLIED" | "INTERVIEW" | "ASSESSMENT" | "OFFER" | "REJECTED" | "WITHDRAWN";

export type Application = {
  id: string;
  candidateId: string;
  resumeFileId: string;
  jobDescriptionId: string;
  status: ApplicationStatus;
  appliedDate: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationWithRelations = Application & {
  resumeFile: { id: string; filename: string };
  jobDescription: { id: string; sourceNote: string | null };
};

export type ApplicationWithFullRelations = Application & {
  candidate: { id: string; name: string; assignedRecruiterId: string | null };
  resumeFile: { id: string; filename: string };
  jobDescription: { id: string; sourceNote: string | null; content: unknown };
};

type ApplicationRow = {
  id: string;
  candidate_id: string;
  resume_file_id: string;
  job_description_id: string;
  status: ApplicationStatus;
  applied_date: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  resume_file?: { id: string; filename: string } | null;
  job_description?: { id: string; source_note: string | null; content?: unknown } | null;
  candidate?: { id: string; name: string; assigned_recruiter_id: string | null } | null;
};

function throwIfError<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data;
}

function mapApplication(row: ApplicationRow): ApplicationWithRelations {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    resumeFileId: row.resume_file_id,
    jobDescriptionId: row.job_description_id,
    status: row.status,
    appliedDate: new Date(row.applied_date),
    createdById: row.created_by_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    resumeFile: row.resume_file ?? { id: row.resume_file_id, filename: "" },
    jobDescription: row.job_description
      ? { id: row.job_description.id, sourceNote: row.job_description.source_note }
      : { id: row.job_description_id, sourceNote: null },
  };
}

export async function listApplicationsForCandidate(
  client: SupabaseClient,
  candidateId: string
): Promise<ApplicationWithRelations[]> {
  const res = await client
    .from("applications")
    .select(
      "*, resume_file:resume_files(id, filename), job_description:job_descriptions(id, source_note)"
    )
    .eq("candidate_id", candidateId)
    .order("applied_date", { ascending: false });
  const data = throwIfError(res as never) as ApplicationRow[];
  return data.map(mapApplication);
}

export async function findApplicationById(
  client: SupabaseClient,
  id: string
): Promise<ApplicationWithFullRelations | null> {
  const res = await client
    .from("applications")
    .select(
      "*, candidate:candidate_profiles(id, name, assigned_recruiter_id), resume_file:resume_files(id, filename), job_description:job_descriptions(id, source_note, content)"
    )
    .eq("id", id)
    .maybeSingle();
  const row = throwIfError(res as never) as ApplicationRow | null;
  if (!row) return null;
  const base = mapApplication(row);
  return {
    ...base,
    candidate: row.candidate
      ? { id: row.candidate.id, name: row.candidate.name, assignedRecruiterId: row.candidate.assigned_recruiter_id }
      : { id: row.candidate_id, name: "", assignedRecruiterId: null },
    jobDescription: { ...base.jobDescription, content: row.job_description?.content ?? null },
  };
}

export async function createApplicationViaRpc(
  client: SupabaseClient,
  params: {
    candidateId: string;
    storageKey: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    uploadedById: string;
    jdContent: unknown;
    sourceNote: string | null;
    status: ApplicationStatus;
    appliedDate: Date;
    createdById: string;
  }
): Promise<string> {
  const res = await client.rpc("create_application", {
    p_candidate_id: params.candidateId,
    p_storage_key: params.storageKey,
    p_filename: params.filename,
    p_mime_type: params.mimeType,
    p_size_bytes: params.sizeBytes,
    p_uploaded_by_id: params.uploadedById,
    p_jd_content: params.jdContent,
    p_source_note: params.sourceNote,
    p_status: params.status,
    p_applied_date: params.appliedDate.toISOString(),
    p_created_by_id: params.createdById,
  });
  return throwIfError(res as never) as string;
}

export async function updateApplicationStatus(
  client: SupabaseClient,
  id: string,
  status: ApplicationStatus
): Promise<void> {
  const res = await client.from("applications").update({ status }).eq("id", id);
  throwIfError(res as never);
}

export type ApplicationForReport = {
  candidateId: string;
  appliedDate: Date;
  status: ApplicationStatus;
  candidateName: string;
};

export async function listApplicationsFiltered(
  client: SupabaseClient,
  filters: { candidateIds?: string[]; from?: Date; to?: Date }
): Promise<ApplicationForReport[]> {
  let query = client
    .from("applications")
    .select("candidate_id, applied_date, status, candidate:candidate_profiles(name)");
  if (filters.candidateIds) query = query.in("candidate_id", filters.candidateIds);
  if (filters.from) query = query.gte("applied_date", filters.from.toISOString());
  if (filters.to) query = query.lte("applied_date", filters.to.toISOString());

  const res = await query;
  const data = throwIfError(res as never) as {
    candidate_id: string;
    applied_date: string;
    status: ApplicationStatus;
    candidate: { name: string } | null;
  }[];
  return data.map((row) => ({
    candidateId: row.candidate_id,
    appliedDate: new Date(row.applied_date),
    status: row.status,
    candidateName: row.candidate?.name ?? "",
  }));
}

/** Applied/interview/assessment counts per candidate, for the dashboard rollup (client-side groupBy). */
export async function countApplicationsByCandidate(
  client: SupabaseClient,
  candidateIds: string[]
): Promise<Map<string, { applications: number; interviews: number; assessments: number }>> {
  const map = new Map<string, { applications: number; interviews: number; assessments: number }>();
  if (candidateIds.length === 0) return map;

  const res = await client.from("applications").select("candidate_id, status").in("candidate_id", candidateIds);
  const data = throwIfError(res as never) as { candidate_id: string; status: ApplicationStatus }[];

  for (const row of data) {
    const entry = map.get(row.candidate_id) ?? { applications: 0, interviews: 0, assessments: 0 };
    entry.applications++;
    if (row.status === "INTERVIEW") entry.interviews++;
    if (row.status === "ASSESSMENT") entry.assessments++;
    map.set(row.candidate_id, entry);
  }
  return map;
}
