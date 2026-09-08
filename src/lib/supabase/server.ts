import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * RLS-scoped client for the current request — Clerk's native Supabase
 * integration passes the live session token as the Postgrest access token,
 * so `auth.jwt()->>'sub'` / `auth.jwt()->'o'->>'rol'` inside RLS policies
 * resolve to this request's signed-in Clerk user (see supabase/migrations/0002_rls.sql).
 * Must be created per-request, not module-level, since it's tied to auth().
 */
export function createSupabaseServerClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    }
  );
}
