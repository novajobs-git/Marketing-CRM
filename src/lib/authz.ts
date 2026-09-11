import type { SessionPayload } from "@/lib/auth";

/** Gates WRITE actions on a candidate — creating/updating applications, logging
 *  a report entry, etc. Viewing a candidate's profile is intentionally NOT
 *  gated by this: every recruiter can see every profile, but a recruiter can
 *  only act on (log activity against) the candidates assigned to them. */
export function canAccessCandidate(
  session: SessionPayload,
  candidate: { assignedRecruiterId: string | null }
): boolean {
  if (session.role === "ADMIN") return true;
  return candidate.assignedRecruiterId === session.sub;
}

const REPORT_ENTRY_EDIT_WINDOW_MS = 8 * 60 * 60 * 1000;

/** Gates editing an existing report entry: the actor must be able to act on
 *  the candidate (see canAccessCandidate) and, unless they're an admin, the
 *  entry must still be within its 8-hour edit window from creation. Admins
 *  are exempt from the window so they can always correct a mistaken entry. */
export function canEditReportEntry(
  session: SessionPayload,
  candidate: { assignedRecruiterId: string | null },
  entry: { createdAt: Date }
): boolean {
  if (!canAccessCandidate(session, candidate)) return false;
  if (session.role === "ADMIN") return true;
  return Date.now() - entry.createdAt.getTime() < REPORT_ENTRY_EDIT_WINDOW_MS;
}
