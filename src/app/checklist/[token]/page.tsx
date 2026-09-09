import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findChecklistLinkByToken } from "@/lib/repo/checklists";
import { ALL_FIELDS, CHECKLIST_ALWAYS_INCLUDED_KEYS } from "@/lib/candidate-fields";
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
  const fields = ALL_FIELDS.filter(
    (f) => CHECKLIST_ALWAYS_INCLUDED_KEYS.includes(f.key) || fieldKeys.includes(f.key)
  );

  return (
    <main className="flex min-h-full flex-1 justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/nova-staffs-logo.png"
            alt="Nova Staffs"
            width={929}
            height={268}
            priority
            className="mb-6 h-9 w-auto"
          />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {link.template.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re excited to learn more about you — please fill this out to join our candidate pool.
          </p>
        </div>

        {link.status !== "PENDING" ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {link.status === "SUBMITTED" ? "Thanks — you're all set" : "Link expired"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {link.status === "SUBMITTED"
                ? "Your information has been submitted and is being reviewed. This link can't be used again."
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
