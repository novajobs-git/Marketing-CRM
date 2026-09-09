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
