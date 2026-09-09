import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findResumeFileWithCandidate } from "@/lib/repo/resume-files";
import { getDownloadUrl } from "@/lib/storage";

// Every recruiter can view every profile (including its resume) — only
// logging activity against a candidate is scoped to admins/the assigned
// recruiter (see canAccessCandidate).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const resume = await findResumeFileWithCandidate(createSupabaseServerClient(), id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = await getDownloadUrl(resume.storageKey);
  return NextResponse.redirect(url);
}
