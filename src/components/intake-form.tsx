"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CandidateDetailFields } from "@/components/candidate-detail-fields";
import { submitIntake, type IntakeActionState } from "@/app/intake/actions";

export function IntakeForm() {
  const [state, formAction, pending] = useActionState<IntakeActionState, FormData>(
    submitIntake,
    null
  );

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Thanks for applying!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve received your information and resume. A recruiter will review your
          submission and reach out if there&apos;s a match.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <CandidateDetailFields />

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </form>
  );
}
