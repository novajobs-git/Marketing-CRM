"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findChecklistLinkByToken, submitChecklistViaRpc } from "@/lib/repo/checklists";
import { uploadObject } from "@/lib/storage";
import { checkResumeFile } from "@/lib/file-validation";
import { PROFESSIONAL_FIELDS, EEO_FIELDS, getChecklistFields } from "@/lib/candidate-fields";
import type { IntakeSubmittedData } from "@/lib/intake";

export type ActionState = { error?: string } | null;

// Personal-section fields that don't map to a candidate_profiles column —
// these fold into the applicationQa JSON blob alongside the professional ones.
const EXTRA_PERSONAL_KEYS = ["linkedin", "github", "otherLinks", "addressLine2", "city"];

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

  const fields = getChecklistFields(link.template.fieldKeys ?? []);
  for (const field of fields) {
    if (field.type === "file" || field.type === "education-history") continue;
    if (field.required && !formString(formData, field.key)) {
      return { error: "Please fill in all required fields." };
    }
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
    [...EXTRA_PERSONAL_KEYS, ...professionalFieldKeys].map((key) => [key, formString(formData, key)])
  ) as IntakeSubmittedData["applicationQa"];

  const eeoAnswers = Object.fromEntries(
    EEO_FIELDS.map((f) => [f.key, formString(formData, f.key)])
  ) as IntakeSubmittedData["eeoAnswers"];

  // No dedicated city/address-line-2 columns — fold them into the single
  // `address` string the rest of the app already expects (the raw parts are
  // still kept in applicationQa above for fidelity in the admin review page).
  const address = [formString(formData, "address"), formString(formData, "addressLine2"), formString(formData, "city")]
    .filter(Boolean)
    .join(", ");

  const submittedData: IntakeSubmittedData = {
    name: formString(formData, "name"),
    role: formString(formData, "role"),
    phone: formString(formData, "phone"),
    email: formString(formData, "email"),
    dob: formString(formData, "dob"),
    address,
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
