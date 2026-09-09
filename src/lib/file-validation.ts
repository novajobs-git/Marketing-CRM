// Shared resume-upload rules — used by both the client dropzone (immediate
// feedback) and every server action that accepts a resume (the source of truth,
// since client-side checks can always be bypassed).
export const RESUME_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const RESUME_ACCEPT = ".pdf,.docx";

const RESUME_MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type ResumeFileCheck = { ok: true; mimeType: string } | { ok: false; error: string };

// Extension-based rather than trusting the browser-reported MIME type, which is
// inconsistent for .docx across browsers/OSes. Returns the canonical MIME type
// to store/upload with, so downstream Content-Type headers are reliable too.
export function checkResumeFile(file: File): ResumeFileCheck {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = extension ? RESUME_MIME_TYPES_BY_EXTENSION[extension] : undefined;
  if (!mimeType) return { ok: false, error: "Resume must be a PDF or DOCX file." };
  if (file.size > RESUME_MAX_BYTES) return { ok: false, error: "Resume must be smaller than 5MB." };
  return { ok: true, mimeType };
}
