import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { upsertUser, updateUserStatus, type UserRole } from "@/lib/repo/users";

// Proactively keeps the local `users` identity mirror in sync with Clerk —
// getSession() (src/lib/auth.ts) also does this lazily on login as a fallback,
// since webhook delivery isn't guaranteed to have landed by the time someone
// who just accepted an invitation loads their first page.

const ORG_ROLE_MAP: Record<string, UserRole> = {
  "org:admin": "ADMIN",
  "org:member": "RECRUITER",
};

export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request, { signingSecret: process.env.CLERK_WEBHOOK_SECRET });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "organizationMembership.created" || event.type === "organizationMembership.updated") {
    const { public_user_data: user, role } = event.data;
    const appRole = ORG_ROLE_MAP[role];
    if (appRole) {
      const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.identifier;
      await upsertUser(supabaseAdmin, { id: user.user_id, name, email: user.identifier, role: appRole, status: "ACTIVE" });
    }
  }

  if (event.type === "organizationMembership.deleted") {
    // Membership removed outside the app (e.g. via the Clerk dashboard) — mirror
    // it as a deactivation, not a delete, so historical FK data is never at risk.
    await updateUserStatus(supabaseAdmin, event.data.public_user_data.user_id, "INACTIVE").catch(() => {
      // No local row yet (they never logged in) — nothing to reconcile.
    });
  }

  return NextResponse.json({ received: true });
}
