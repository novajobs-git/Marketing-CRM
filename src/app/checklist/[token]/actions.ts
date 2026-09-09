"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findChecklistLinkByToken, submitChecklistViaRpc } from "@/lib/repo/checklists";
import { uploadObject } from "@/lib/storage";
import { checkResumeFile } from "@/lib/file-validation";
import { PROFESSIONAL_FIELDS, EEO_FIELDS, CHECKLIST_ALWAYS_INCLUDED_KEYS } from "@/lib/candidate-fields";
import type { IntakeSubmittedData } from "@/lib/intake";

export type ActionState = { error?: string } | null;

const TOP_LEVEL_KEYS = CHECKLIST_ALWAYS_INCLUDED_KEYS.filter((key) => key !== "resume");

function formString(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

// Single-use public submission — the link stops accepting further submissions
// as soon as this succeeds (FR: "expires after submission"). No Clerk session
// exists here at all, so this goes through the service-role client — the
// unguessable token itself is the authorization boundary.
//
// A checklist link brings a brand-new person into the CRM (there's no
// candidate row yet), so this builds the same IntakeSubmittedData shape the
// public /intake form produces and drops it into the same pending-review
// queue an admin already works from at /admin/profiles — fields the
// template didn't request just come through empty, which the review page
// already renders as "—".
export async function submitChecklist(token: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const link = await findChecklistLinkByToken(supabaseAdmin, token);
  if (!link) return { error: "This link is invalid." };
  if (link.status !== "PENDING") {
    return { error: "This link has already been used and can no longer accept submissions." };
  }

  for (const key of TOP_LEVEL_KEYS) {
    if (!formString(formData, key)) return { error: "Please fill in all required fields." };
  }

  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "A resume is required." };
  }
  const check = checkResumeFile(file);
  if (!check.ok) return { error: check.error };

  let educationHistory: unknown = [];
  const rawEducation = formData.get("educationHistory");
  if (typeof rawEducation === "string" && rawEducation) {
    try {
      educationHistory = JSON.parse(rawEducation);
    } catch {
      // leave as empty array if somehow malformed
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = `checklist/${Date.now()}-${file.name}`;
  await uploadObject(storageKey, buffer, check.mimeType);

  const professionalFieldKeys = PROFESSIONAL_FIELDS.filter((f) => f.key !== "role" && f.key !== "resume").map(
    (f) => f.key
  );
  const applicationQa = Object.fromEntries(
    professionalFieldKeys.map((key) => [key, formString(formData, key)])
  ) as IntakeSubmittedData["applicationQa"];

  const eeoAnswers = Object.fromEntries(
    EEO_FIELDS.map((f) => [f.key, formString(formData, f.key)])
  ) as IntakeSubmittedData["eeoAnswers"];

  const submittedData: IntakeSubmittedData = {
    name: formString(formData, "name"),
    role: formString(formData, "role"),
    phone: formString(formData, "phone"),
    email: formString(formData, "email"),
    dob: formString(formData, "dob"),
    address: formString(formData, "address"),
    state: formString(formData, "state"),
    zipCode: formString(formData, "zipCode"),
    eeoAnswers,
    applicationQa,
    educationHistory: educationHistory as IntakeSubmittedData["educationHistory"],
    resume: {
      storageKey,
      filename: file.name,
      mimeType: check.mimeType,
      sizeBytes: file.size,
    },
  };

  await submitChecklistViaRpc(supabaseAdmin, {
    linkId: link.id,
    submittedData: submittedData as unknown as Record<string, unknown>,
  });

  redirect(`/checklist/${token}`);
}
