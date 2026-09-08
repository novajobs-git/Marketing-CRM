import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. Reserved for system-level
 * writes that happen without (or before) a matching user-scoped RLS grant:
 * the Clerk webhook (no user session at all) and JIT identity provisioning
 * in getSession() (a brand-new user upserting their own `users` row on
 * first login). Everywhere else, prefer the per-request RLS-scoped client
 * from ./server so the database enforces authorization independently of
 * the app layer.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
