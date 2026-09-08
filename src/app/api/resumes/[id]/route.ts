import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findResumeFileWithCandidate } from "@/lib/repo/resume-files";
import { canAccessCandidate } from "@/lib/authz";
import { getDownloadUrl } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const resume = await findResumeFileWithCandidate(createSupabaseServerClient(), id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessCandidate(session, resume.candidate)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = await getDownloadUrl(resume.storageKey);
  return NextResponse.redirect(url);
}
