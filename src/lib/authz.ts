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

/** Gates report entries specifically (add/edit) — broader than
 *  canAccessCandidate: a team lead can log/view reports for ANY candidate,
 *  not just their own assigned ones, without gaining the rest of
 *  canAccessCandidate's grants (applications, editing the profile, archive). */
export function canManageReportsForCandidate(
  session: SessionPayload,
  candidate: { assignedRecruiterId: string | null }
): boolean {
  if (session.isTeamLead) return true;
  return canAccessCandidate(session, candidate);
}

const REPORT_ENTRY_EDIT_WINDOW_MS = 8 * 60 * 60 * 1000;

/** Gates editing an existing report entry: the actor must be able to manage
 *  reports for the candidate (see canManageReportsForCandidate) and, unless
 *  they're an admin, the entry must still be within its 8-hour edit window
 *  from creation. Only admins are exempt from the window — a team lead is
 *  bound by the same window as any recruiter. */
export function canEditReportEntry(
  session: SessionPayload,
  candidate: { assignedRecruiterId: string | null },
  entry: { createdAt: Date }
): boolean {
  if (!canManageReportsForCandidate(session, candidate)) return false;
  if (session.role === "ADMIN") return true;
  return Date.now() - entry.createdAt.getTime() < REPORT_ENTRY_EDIT_WINDOW_MS;
}
