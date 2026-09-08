"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findChecklistLinkByToken, submitChecklistViaRpc } from "@/lib/repo/checklists";
import { uploadObject } from "@/lib/storage";
import { PROFESSIONAL_FIELDS, EEO_FIELDS } from "@/lib/candidate-fields";

export type ActionState = { error?: string } | null;

const TOP_LEVEL_KEYS = new Set(["name", "role", "phone", "email", "dob", "address", "state", "zipCode"]);
const PROFESSIONAL_KEYS = new Set(PROFESSIONAL_FIELDS.map((f) => f.key));
const EEO_KEYS = new Set(EEO_FIELDS.map((f) => f.key));
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

// Single-use public submission — the link stops accepting further submissions
// as soon as this succeeds (FR: "expires after submission"). No Clerk session
// exists here at all, so this goes through the service-role client — the
// unguessable token itself is the authorization boundary, same trust model
// as the pre-migration Prisma version.
export async function submitChecklist(token: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const link = await findChecklistLinkByToken(supabaseAdmin, token);
  if (!link) return { error: "This link is invalid." };
  if (link.status !== "PENDING") {
    return { error: "This link has already been used and can no longer accept submissions." };
  }

  const fieldKeys = link.template.fieldKeys;

  const topLevelUpdate: Record<string, string> = {};
  const professionalUpdate: Record<string, string> = {};
  const eeoUpdate: Record<string, string> = {};
  const submittedData: Record<string, unknown> = {};

  for (const key of fieldKeys) {
    if (key === "resume" || key === "educationHistory") continue;
    const raw = formData.get(key);
    if (raw === null) continue;
    const value = String(raw).trim();
    submittedData[key] = value;
    if (TOP_LEVEL_KEYS.has(key)) {
      topLevelUpdate[key] = value;
    } else if (PROFESSIONAL_KEYS.has(key)) {
      professionalUpdate[key] = value;
    } else if (EEO_KEYS.has(key)) {
      eeoUpdate[key] = value;
    }
  }

  let educationUpdate: unknown | undefined;
  if (fieldKeys.includes("educationHistory")) {
    const raw = formData.get("educationHistory");
    if (typeof raw === "string" && raw) {
      try {
        educationUpdate = JSON.parse(raw);
        submittedData.educationHistory = educationUpdate;
      } catch {
        // ignore malformed education JSON, skip that field
      }
    }
  }

  let newResume: { storageKey: string; filename: string; mimeType: string; sizeBytes: number } | null = null;
  if (fieldKeys.includes("resume")) {
    const file = formData.get("resume");
    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf") return { error: "Resume must be a PDF file." };
      if (file.size > MAX_RESUME_BYTES) return { error: "Resume must be smaller than 10MB." };
      const buffer = Buffer.from(await file.arrayBuffer());
      const storageKey = `candidates/${link.candidateId}/checklist/${Date.now()}-${file.name}`;
      await uploadObject(storageKey, buffer, file.type);
      newResume = { storageKey, filename: file.name, mimeType: file.type, sizeBytes: file.size };
      submittedData.resume = { filename: file.name };
    }
  }

  const mergedApplicationQa =
    Object.keys(professionalUpdate).length > 0 ? { ...(link.candidate.applicationQa ?? {}), ...professionalUpdate } : null;
  const mergedEeoAnswers =
    Object.keys(eeoUpdate).length > 0 ? { ...(link.candidate.eeoAnswers ?? {}), ...eeoUpdate } : null;

  await submitChecklistViaRpc(supabaseAdmin, {
    linkId: link.id,
    topLevel: topLevelUpdate,
    applicationQa: mergedApplicationQa,
    eeoAnswers: mergedEeoAnswers,
    educationHistory: educationUpdate ?? null,
    resumeStorageKey: newResume?.storageKey ?? null,
    resumeFilename: newResume?.filename ?? null,
    resumeMimeType: newResume?.mimeType ?? null,
    resumeSizeBytes: newResume?.sizeBytes ?? null,
    submittedData,
  });

  redirect(`/checklist/${token}`);
}
