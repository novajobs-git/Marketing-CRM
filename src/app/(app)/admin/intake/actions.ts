"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  findIntakeSubmissionById,
  approveIntakeSubmissionViaRpc,
  rejectIntakeSubmission as rejectIntakeSubmissionRepo,
} from "@/lib/repo/intake-submissions";
import type { IntakeSubmittedData } from "@/lib/intake";

// FR-4.3 — admin reviews a submission before it becomes an active profile.
export async function approveIntakeSubmission(submissionId: string): Promise<void> {
  const admin = await requireAdmin();
  const client = createSupabaseServerClient();

  const submission = await findIntakeSubmissionById(client, submissionId);
  if (!submission || submission.status !== "PENDING") return;

  const data = submission.submittedData as unknown as IntakeSubmittedData;

  const candidateId = await approveIntakeSubmissionViaRpc(client, {
    submissionId,
    name: data.name,
    role: data.role,
    phone: data.phone,
    email: data.email,
    dob: new Date(data.dob),
    address: data.address || null,
    state: data.state,
    zipCode: data.zipCode,
    eeoAnswers: data.eeoAnswers,
    applicationQa: data.applicationQa,
    educationHistory: data.educationHistory,
    resumeStorageKey: data.resume.storageKey,
    resumeFilename: data.resume.filename,
    resumeMimeType: data.resume.mimeType,
    resumeSizeBytes: data.resume.sizeBytes,
    reviewedById: admin.sub,
  });

  revalidatePath("/admin/profiles");
  redirect(`/candidates/${candidateId}`);
}

export async function rejectIntakeSubmission(submissionId: string): Promise<void> {
  const admin = await requireAdmin();
  await rejectIntakeSubmissionRepo(createSupabaseServerClient(), submissionId, admin.sub);
  revalidatePath("/admin/profiles");
  redirect("/admin/profiles");
}
