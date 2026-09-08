"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCandidateById } from "@/lib/repo/candidates";
import { createApplicationViaRpc, findApplicationById, updateApplicationStatus as updateApplicationStatusRepo } from "@/lib/repo/applications";
import { requireSession } from "@/lib/auth";
import { canAccessCandidate } from "@/lib/authz";
import { uploadObject } from "@/lib/storage";
import type { JSONContent } from "@tiptap/react";

export type ActionState = { error?: string } | null;

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10MB

const STATUS_VALUES = [
  "APPLIED",
  "INTERVIEW",
  "ASSESSMENT",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

const applicationSchema = z.object({
  sourceNote: z.string().trim().optional(),
  appliedDate: z.string().trim().min(1, "Application date is required."),
  status: z.enum(STATUS_VALUES),
  jdContent: z.string().trim().min(1, "A job description is required."),
});

function isJdEmpty(json: JSONContent): boolean {
  const text = JSON.stringify(json);
  // Tiptap's empty-doc JSON still has structure; check for absence of any text node.
  return !/"text":/.test(text);
}

// FR-6.2/6.3 — one atomic record: tailored resume + JD + application entry.
export async function createApplication(
  candidateId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const client = createSupabaseServerClient();

  const candidate = await findCandidateById(client, candidateId);
  if (!candidate) return { error: "Profile not found." };
  if (!canAccessCandidate(session, candidate)) return { error: "Not authorized." };

  const parsed = applicationSchema.safeParse({
    sourceNote: formData.get("sourceNote") ?? undefined,
    appliedDate: formData.get("appliedDate"),
    status: formData.get("status"),
    jdContent: formData.get("jdContent"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let jdJson: JSONContent;
  try {
    jdJson = JSON.parse(parsed.data.jdContent);
  } catch {
    return { error: "Invalid job description content." };
  }
  if (isJdEmpty(jdJson)) {
    return { error: "The job description can't be empty." };
  }

  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "A tailored resume PDF is required." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Resume must be a PDF file." };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return { error: "Resume must be smaller than 10MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = `candidates/${candidateId}/applications/${Date.now()}-${file.name}`;
  await uploadObject(storageKey, buffer, file.type);

  const applicationId = await createApplicationViaRpc(client, {
    candidateId,
    storageKey,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedById: session.sub,
    jdContent: jdJson,
    sourceNote: parsed.data.sourceNote || null,
    status: parsed.data.status,
    appliedDate: new Date(parsed.data.appliedDate),
    createdById: session.sub,
  });

  revalidatePath(`/candidates/${candidateId}`);
  redirect(`/candidates/${candidateId}/applications/${applicationId}`);
}

// FR-6.5 — status is updatable by the recruiter as it progresses.
export async function updateApplicationStatus(
  applicationId: string,
  status: (typeof STATUS_VALUES)[number]
): Promise<void> {
  const session = await requireSession();
  const client = createSupabaseServerClient();

  const application = await findApplicationById(client, applicationId);
  if (!application) return;
  if (!canAccessCandidate(session, application.candidate)) return;

  await updateApplicationStatusRepo(client, applicationId, status);
  revalidatePath(`/candidates/${application.candidate.id}`);
  revalidatePath(`/candidates/${application.candidate.id}/applications/${applicationId}`);
}
