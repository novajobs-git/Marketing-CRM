import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findUserById, upsertUser, type UserRole } from "@/lib/repo/users";

/**
 * Kept identical in shape to the pre-Clerk JWT payload so every existing
 * `session.role`/`session.sub`/`session.name`/`session.email` call site
 * across the app didn't need to change during the auth migration.
 */
export type SessionPayload = {
  sub: string;
  role: UserRole;
  name: string;
  email: string;
};

// Clerk's built-in org roles map directly onto this app's two roles — no
// custom Clerk role configuration needed.
const ORG_ROLE_MAP: Record<string, UserRole> = {
  "org:admin": "ADMIN",
  "org:member": "RECRUITER",
};

/**
 * Reads and verifies the current Clerk session for the current request.
 * Cached per-request so repeated calls in a render pass don't re-verify.
 *
 * Returns null if there's no session, OR if the session has no *active*
 * Clerk Organization — Clerk only includes the org-role claim on a session
 * when an org is active, which requires the sole agency org to be the only
 * organization each user belongs to (see the Clerk dashboard org settings).
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const { userId, orgRole } = await auth();
  if (!userId || !orgRole) return null;

  const role = ORG_ROLE_MAP[orgRole];
  if (!role) return null;

  const user = await currentUser();
  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || email;

  // Keeps the local `users` identity mirror in sync. This is the *reliable*
  // path (the Clerk webhook is the proactive one, but webhook delivery isn't
  // guaranteed to have landed yet — e.g. immediately after a user accepts an
  // org invitation and logs in for the first time, before Clerk's webhook
  // fires). If they got this far, Clerk has already authenticated them and
  // confirmed their org role, so ACTIVE is always correct here — a banned
  // user can't reach this line at all, since Clerk itself blocks their
  // sign-in before a session ever exists.
  //
  // getSession() runs on every request, so writing unconditionally here means
  // every single page load did an upsert even though the row is already
  // correct the overwhelming majority of the time. Reading first and only
  // writing on an actual mismatch turns that into a plain indexed lookup in
  // the common case, avoiding the extra write-path cost (WAL, index upkeep)
  // on every navigation.
  const existing = await findUserById(supabaseAdmin, userId);
  const inSync =
    existing?.name === name &&
    existing?.email === email &&
    existing?.role === role &&
    existing?.status === "ACTIVE";
  if (!inSync) {
    await upsertUser(supabaseAdmin, { id: userId, name, email, role, status: "ACTIVE" });
  }

  return { sub: userId, role, name, email };
});

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN") throw new Error("Admin access required");
  return session;
}
