"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateCandidate,
  archiveCandidate,
  unarchiveCandidate,
  bulkArchiveCandidates,
  bulkReassignCandidates,
  findCandidateById,
} from "@/lib/repo/candidates";
import { createResumeFile } from "@/lib/repo/resume-files";
import { requireAdmin } from "@/lib/auth";
import { uploadObject } from "@/lib/storage";
import { parseCandidateDetailForm, candidateDetailToDbFields } from "@/lib/candidate-form-schema";
import { checkResumeFile } from "@/lib/file-validation";

export type ActionState = { error?: string } | null;

async function validateResumeFile(formData: FormData, required: boolean) {
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    if (required) return { error: "A resume is required." } as const;
    return { file: null, mimeType: null } as const;
  }
  const check = checkResumeFile(file);
  if (!check.ok) return { error: check.error } as const;
  return { file, mimeType: check.mimeType } as const;
}

// FR-3.2 — admin edits any field, including reassigning the recruiter (FR-2.4).
export async function updateCandidateProfile(
  candidateId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const client = createSupabaseServerClient();

  const parsed = parseCandidateDetailForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const resumeResult = await validateResumeFile(formData, false);
  if ("error" in resumeResult) return { error: resumeResult.error };

  const existing = await findCandidateById(client, candidateId);
  if (!existing) return { error: "Profile not found." };

  const assignedRecruiterId = (formData.get("assignedRecruiterId") as string) || null;

  await updateCandidate(client, candidateId, candidateDetailToDbFields(parsed.data), {
    assignedRecruiterId,
    status: existing.status === "ARCHIVED" ? "ARCHIVED" : assignedRecruiterId ? "ACTIVE" : "UNASSIGNED",
  });

  if (resumeResult.file) {
    const file = resumeResult.file;
    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = `candidates/${candidateId}/${Date.now()}-${file.name}`;
    await uploadObject(storageKey, buffer, resumeResult.mimeType);
    await createResumeFile(client, {
      candidateId,
      storageKey,
      filename: file.name,
      mimeType: resumeResult.mimeType,
      sizeBytes: file.size,
      isTailoredVersion: false,
    });
  }

  revalidatePath("/admin/profiles");
  revalidatePath(`/candidates/${candidateId}`);
  redirect(`/candidates/${candidateId}`);
}

// FR-3.4 — archive (soft delete) without losing historical application data.
export async function archiveCandidateProfile(candidateId: string): Promise<void> {
  await requireAdmin();
  await archiveCandidate(createSupabaseServerClient(), candidateId);
  revalidatePath("/admin/profiles");
  revalidatePath(`/candidates/${candidateId}`);
}

// FR-3.4 — bulk archive, same soft-delete semantics as the single-profile action.
export async function bulkArchiveCandidateProfiles(candidateIds: string[]): Promise<void> {
  await requireAdmin();
  await bulkArchiveCandidates(createSupabaseServerClient(), candidateIds);
  revalidatePath("/admin/profiles");
}

// FR-2.4 — bulk assign/reassign one or more candidate profiles to a recruiter (or unassign).
// Archived profiles keep their ARCHIVED status; only the recruiter assignment moves for those.
export async function bulkReassignCandidateProfiles(
  candidateIds: string[],
  recruiterId: string | null
): Promise<void> {
  await requireAdmin();
  await bulkReassignCandidates(createSupabaseServerClient(), candidateIds, recruiterId);
  revalidatePath("/admin/profiles");
  revalidatePath("/admin/users");
}

export async function unarchiveCandidateProfile(candidateId: string): Promise<void> {
  await requireAdmin();
  await unarchiveCandidate(createSupabaseServerClient(), candidateId);
  revalidatePath("/admin/profiles");
  revalidatePath(`/candidates/${candidateId}`);
}
