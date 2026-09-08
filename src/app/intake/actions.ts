"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createIntakeSubmission } from "@/lib/repo/intake-submissions";
import { uploadObject } from "@/lib/storage";
import { parseCandidateDetailForm, candidateDetailToDbFields } from "@/lib/candidate-form-schema";
import type { IntakeSubmittedData } from "@/lib/intake";

export type IntakeActionState = { error?: string; success?: boolean } | null;

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10MB

// FR-4.1/4.2 — public intake form submission, stored for admin review (FR-4.3).
export async function submitIntake(
  _prev: IntakeActionState,
  formData: FormData
): Promise<IntakeActionState> {
  const parsed = parseCandidateDetailForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "A resume PDF is required." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Resume must be a PDF file." };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return { error: "Resume must be smaller than 10MB." };
  }

  const storageKey = `intake/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadObject(storageKey, buffer, file.type);

  const fields = candidateDetailToDbFields(parsed.data);

  const submittedData: IntakeSubmittedData = {
    name: fields.name,
    role: fields.role,
    phone: fields.phone,
    email: fields.email,
    dob: fields.dob.toISOString(),
    address: fields.address,
    state: fields.state,
    zipCode: fields.zipCode,
    eeoAnswers: fields.eeoAnswers as IntakeSubmittedData["eeoAnswers"],
    applicationQa: fields.applicationQa as IntakeSubmittedData["applicationQa"],
    educationHistory: fields.educationHistory as IntakeSubmittedData["educationHistory"],
    resume: {
      storageKey,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  };

  await createIntakeSubmission(supabaseAdmin, submittedData);

  return { success: true };
}
