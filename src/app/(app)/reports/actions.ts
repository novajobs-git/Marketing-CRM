"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCandidateById } from "@/lib/repo/candidates";
import {
  createReportEntry as createReportEntryRepo,
  findReportEntryById,
  updateReportEntry as updateReportEntryRepo,
} from "@/lib/repo/report-entries";
import { requireSession } from "@/lib/auth";
import { canAccessCandidate, canEditReportEntry } from "@/lib/authz";

export type ActionState = { error?: string } | null;

const reportSchema = z.object({
  date: z.string().trim().min(1, "Date is required."),
  applicationsCount: z.coerce.number().int().min(0),
  interviewsCount: z.coerce.number().int().min(0),
  offersCount: z.coerce.number().int().min(0),
  notes: z.string().trim().optional(),
});

// FR-8.3 — recruiter (or admin) manually logs a day's activity against a candidate.
// Additive to, not a replacement for, counts derived from logged Applications (FR-8.5).
export async function createReportEntry(
  candidateId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const client = createSupabaseServerClient();

  const candidate = await findCandidateById(client, candidateId);
  if (!candidate) return { error: "Profile not found." };
  if (!canAccessCandidate(session, candidate)) return { error: "Not authorized." };

  const parsed = reportSchema.safeParse({
    date: formData.get("date"),
    applicationsCount: formData.get("applicationsCount") || 0,
    interviewsCount: formData.get("interviewsCount") || 0,
    offersCount: formData.get("offersCount") || 0,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await createReportEntryRepo(client, {
    candidateId,
    date: new Date(parsed.data.date),
    applicationsCount: parsed.data.applicationsCount,
    interviewsCount: parsed.data.interviewsCount,
    offersCount: parsed.data.offersCount,
    notes: parsed.data.notes || null,
    createdById: session.sub,
  });

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/reports");
  return { error: undefined };
}

// Recruiters may correct an entry only within 8 hours of logging it; admins
// are exempt (see canEditReportEntry). Re-checked here even though the UI
// already hides the edit control past the window — the server is what
// actually enforces it.
export async function updateReportEntry(
  entryId: string,
  candidateId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const client = createSupabaseServerClient();

  const candidate = await findCandidateById(client, candidateId);
  if (!candidate) return { error: "Profile not found." };

  const entry = await findReportEntryById(client, entryId);
  if (!entry || entry.candidateId !== candidateId) return { error: "Report entry not found." };
  if (!canEditReportEntry(session, candidate, entry)) {
    return { error: "This report entry can no longer be edited (past the 8-hour edit window)." };
  }

  const parsed = reportSchema.safeParse({
    date: formData.get("date"),
    applicationsCount: formData.get("applicationsCount") || 0,
    interviewsCount: formData.get("interviewsCount") || 0,
    offersCount: formData.get("offersCount") || 0,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await updateReportEntryRepo(client, entryId, {
    date: new Date(parsed.data.date),
    applicationsCount: parsed.data.applicationsCount,
    interviewsCount: parsed.data.interviewsCount,
    offersCount: parsed.data.offersCount,
    notes: parsed.data.notes || null,
  });

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/reports");
  return { error: undefined };
}
