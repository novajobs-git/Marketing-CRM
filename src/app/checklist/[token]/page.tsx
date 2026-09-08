import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findChecklistLinkByToken } from "@/lib/repo/checklists";
import { ALL_FIELDS } from "@/lib/candidate-fields";
import { ChecklistForm } from "@/components/checklist-form";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const link = await findChecklistLinkByToken(supabaseAdmin, token);

  if (!link) notFound();

  const fieldKeys = link.template.fieldKeys ?? [];
  const fields = ALL_FIELDS.filter((f) => fieldKeys.includes(f.key));

  return (
    <main className="flex min-h-full flex-1 justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {link.template.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Hi {link.candidate.name} — please fill this out.</p>
        </div>

        {link.status !== "PENDING" ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {link.status === "SUBMITTED" ? "Thanks — you're all set" : "Link expired"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {link.status === "SUBMITTED"
                ? "This information has been submitted. This link can't be used again — ask your recruiter for a new one if you need to make further changes."
                : "This link is no longer active. Ask your recruiter for a new link."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <ChecklistForm token={token} fields={fields} />
          </div>
        )}
      </div>
    </main>
  );
}
