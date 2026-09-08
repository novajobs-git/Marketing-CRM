"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findUserByEmail, findUserById, updateUserStatus, deleteUserRow } from "@/lib/repo/users";
import { reassignAllProfiles as reassignAllProfilesRepo } from "@/lib/repo/candidates";
import { requireAdmin } from "@/lib/auth";

export type ActionState = { error?: string; success?: string } | null;

const createRecruiterSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
});

// FR-2.1 — admin invites a new recruiter account (name kept for the invitation's
// context; the recruiter sets their own credentials via Clerk when they accept).
// The `users` mirror row for them doesn't exist yet — it's created lazily on their
// first login (see getSession() in src/lib/auth.ts) or by the Clerk webhook.
export async function createRecruiter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const client = createSupabaseServerClient();

  const parsed = createRecruiterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await findUserByEmail(client, parsed.data.email);
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const orgId = process.env.CLERK_ORGANIZATION_ID;
  if (!orgId) {
    return { error: "CLERK_ORGANIZATION_ID is not configured." };
  }

  const clerk = await clerkClient();
  try {
    await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: parsed.data.email,
      role: "org:member",
      inviterUserId: admin.sub,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not send the invitation. Please try again.";
    return { error: message };
  }

  revalidatePath("/admin/users");
  return { success: `Invitation sent to ${parsed.data.email}.` };
}

// FR-2.2 — deactivate/reactivate retains historical data. Clerk's ban is what
// actually blocks sign-in; the local `status` mirror drives the Active/Inactive
// badge and view-tab counts on the recruiters list without an extra Clerk call.
export async function toggleRecruiterStatus(userId: string): Promise<ActionState> {
  await requireAdmin();
  const client = createSupabaseServerClient();

  const user = await findUserById(client, userId);
  if (!user || user.role !== "RECRUITER") return { error: "Recruiter not found." };

  const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const clerk = await clerkClient();
  if (nextStatus === "INACTIVE") {
    await clerk.users.banUser(userId);
  } else {
    await clerk.users.unbanUser(userId);
  }

  await updateUserStatus(client, userId, nextStatus);

  revalidatePath("/admin/users");
  return null;
}

// FR-2.4 — move every profile currently assigned to one recruiter over to another
// (or unassign them), e.g. before deactivating/removing a recruiter with an active book.
export async function reassignAllProfiles(
  fromRecruiterId: string,
  toRecruiterId: string | null
): Promise<ActionState> {
  await requireAdmin();
  const client = createSupabaseServerClient();

  if (toRecruiterId === fromRecruiterId) {
    return { error: "Pick a different recruiter to reassign to." };
  }

  const fromRecruiter = await findUserById(client, fromRecruiterId);
  if (!fromRecruiter || fromRecruiter.role !== "RECRUITER") {
    return { error: "Recruiter not found." };
  }

  await reassignAllProfilesRepo(client, fromRecruiterId, toRecruiterId);

  revalidatePath("/admin/users");
  revalidatePath("/admin/profiles");
  return null;
}

// FR-2.2 — deleting is a separate, confirmed action (distinct from deactivate).
// The local FK guard runs *before* touching Clerk, so a blocked deletion (recruiter
// has historical activity) has no side effects on either side — matching the
// all-or-nothing feel the friendly error message implies.
export async function deleteRecruiter(userId: string): Promise<ActionState> {
  await requireAdmin();
  const client = createSupabaseServerClient();

  try {
    await deleteUserRow(client, userId);
  } catch (err) {
    if (err instanceof Error && (err as Error & { code?: string }).code === "23503") {
      return {
        error:
          "This recruiter has historical activity (applications, reports, or assigned profiles) and can't be deleted. Deactivate instead.",
      };
    }
    throw err;
  }

  const clerk = await clerkClient();
  await clerk.users.deleteUser(userId);

  revalidatePath("/admin/users");
  return null;
}
