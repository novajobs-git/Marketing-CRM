import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ResumeFile = {
  id: string;
  candidateId: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  isTailoredVersion: boolean;
  uploadedById: string | null;
  uploadedAt: Date;
};

type ResumeFileRow = {
  id: string;
  candidate_id: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  is_tailored_version: boolean;
  uploaded_by_id: string | null;
  uploaded_at: string;
};

function throwIfError<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data;
}

function mapResumeFile(row: ResumeFileRow): ResumeFile {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    storageKey: row.storage_key,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    isTailoredVersion: row.is_tailored_version,
    uploadedById: row.uploaded_by_id,
    uploadedAt: new Date(row.uploaded_at),
  };
}

export async function listResumeFilesForCandidate(
  client: SupabaseClient,
  candidateId: string,
  opts: { tailoredOnly?: boolean; baseOnly?: boolean; limit?: number } = {}
): Promise<ResumeFile[]> {
  let query = client
    .from("resume_files")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("uploaded_at", { ascending: false });
  if (opts.tailoredOnly) query = query.eq("is_tailored_version", true);
  if (opts.baseOnly) query = query.eq("is_tailored_version", false);
  if (opts.limit) query = query.limit(opts.limit);
  const res = await query;
  const data = throwIfError(res as never) as ResumeFileRow[];
  return data.map(mapResumeFile);
}

export async function findResumeFileById(client: SupabaseClient, id: string): Promise<ResumeFile | null> {
  const res = await client.from("resume_files").select("*").eq("id", id).maybeSingle();
  const data = throwIfError(res as never) as ResumeFileRow | null;
  return data ? mapResumeFile(data) : null;
}

export async function findResumeFileWithCandidate(
  client: SupabaseClient,
  id: string
): Promise<(ResumeFile & { candidate: { assignedRecruiterId: string | null } }) | null> {
  const res = await client
    .from("resume_files")
    .select("*, candidate:candidate_profiles(assigned_recruiter_id)")
    .eq("id", id)
    .maybeSingle();
  const row = throwIfError(res as never) as (ResumeFileRow & { candidate: { assigned_recruiter_id: string | null } | null }) | null;
  if (!row) return null;
  return { ...mapResumeFile(row), candidate: { assignedRecruiterId: row.candidate?.assigned_recruiter_id ?? null } };
}

export async function createResumeFile(
  client: SupabaseClient,
  fields: {
    candidateId: string;
    storageKey: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    isTailoredVersion: boolean;
    uploadedById?: string | null;
  }
): Promise<{ id: string }> {
  const res = await client
    .from("resume_files")
    .insert({
      candidate_id: fields.candidateId,
      storage_key: fields.storageKey,
      filename: fields.filename,
      mime_type: fields.mimeType,
      size_bytes: fields.sizeBytes,
      is_tailored_version: fields.isTailoredVersion,
      uploaded_by_id: fields.uploadedById ?? null,
    })
    .select("id")
    .single();
  return throwIfError(res as never) as { id: string };
}
