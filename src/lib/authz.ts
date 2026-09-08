import type { SessionPayload } from "@/lib/auth";

/** FR-1.2 — recruiters may only act on candidate profiles assigned to them. */
export function canAccessCandidate(
  session: SessionPayload,
  candidate: { assignedRecruiterId: string | null }
): boolean {
  if (session.role === "ADMIN") return true;
  return candidate.assignedRecruiterId === session.sub;
}
