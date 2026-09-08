import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type IntakeStatus = "PENDING" | "APPROVED" | "REJECTED";

export type IntakeSubmission = {
  id: string;
  submittedData: Record<string, unknown>;
  status: IntakeStatus;
  resultingProfileId: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

type IntakeSubmissionRow = {
  id: string;
  submitted_data: Record<string, unknown>;
  status: IntakeStatus;
  resulting_profile_id: string | null;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  created_at: string;
};

function throwIfError<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data;
}

function mapIntakeSubmission(row: IntakeSubmissionRow): IntakeSubmission {
  return {
    id: row.id,
    submittedData: row.submitted_data,
    status: row.status,
    resultingProfileId: row.resulting_profile_id,
    reviewedById: row.reviewed_by_id,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    createdAt: new Date(row.created_at),
  };
}

export async function listPendingIntakeSubmissions(client: SupabaseClient): Promise<IntakeSubmission[]> {
  const res = await client
    .from("intake_submissions")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });
  const data = throwIfError(res as never) as IntakeSubmissionRow[];
  return data.map(mapIntakeSubmission);
}

export async function findIntakeSubmissionById(
  client: SupabaseClient,
  id: string
): Promise<IntakeSubmission | null> {
  const res = await client.from("intake_submissions").select("*").eq("id", id).maybeSingle();
  const data = throwIfError(res as never) as IntakeSubmissionRow | null;
  return data ? mapIntakeSubmission(data) : null;
}

/** Public, no session — inserted via the service-role client. */
export async function createIntakeSubmission(
  client: SupabaseClient,
  submittedData: Record<string, unknown>
): Promise<void> {
  const res = await client.from("intake_submissions").insert({ submitted_data: submittedData, status: "PENDING" });
  throwIfError(res as never);
}

export async function rejectIntakeSubmission(
  client: SupabaseClient,
  id: string,
  reviewedById: string
): Promise<void> {
  const res = await client
    .from("intake_submissions")
    .update({ status: "REJECTED", reviewed_by_id: reviewedById, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "PENDING");
  throwIfError(res as never);
}

export async function approveIntakeSubmissionViaRpc(
  client: SupabaseClient,
  params: {
    submissionId: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    dob: Date;
    address: string | null;
    state: string;
    zipCode: string;
    eeoAnswers: Record<string, unknown>;
    applicationQa: Record<string, unknown>;
    educationHistory: unknown;
    resumeStorageKey: string;
    resumeFilename: string;
    resumeMimeType: string;
    resumeSizeBytes: number;
    reviewedById: string;
  }
): Promise<string> {
  const res = await client.rpc("approve_intake_submission", {
    p_submission_id: params.submissionId,
    p_name: params.name,
    p_role: params.role,
    p_phone: params.phone,
    p_email: params.email,
    p_dob: params.dob.toISOString().slice(0, 10),
    p_address: params.address,
    p_state: params.state,
    p_zip_code: params.zipCode,
    p_eeo_answers: params.eeoAnswers,
    p_application_qa: params.applicationQa,
    p_education_history: params.educationHistory,
    p_resume_storage_key: params.resumeStorageKey,
    p_resume_filename: params.resumeFilename,
    p_resume_mime_type: params.resumeMimeType,
    p_resume_size_bytes: params.resumeSizeBytes,
    p_reviewed_by_id: params.reviewedById,
  });
  return throwIfError(res as never) as string;
}
