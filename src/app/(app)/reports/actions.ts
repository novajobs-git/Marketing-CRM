"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCandidateById } from "@/lib/repo/candidates";
import { createReportEntry as createReportEntryRepo } from "@/lib/repo/report-entries";
import { requireSession } from "@/lib/auth";
import { canAccessCandidate } from "@/lib/authz";

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
