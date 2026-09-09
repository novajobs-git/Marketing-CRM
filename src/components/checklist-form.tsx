"use client";

import { useActionState, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DynamicFieldInput } from "@/components/dynamic-field-input";
import { ResumeFileUpload } from "@/components/resume-file-upload";
import {
  EducationHistoryFields,
  emptyEducationHistory,
} from "@/components/education-history-fields";
import type { FieldDef } from "@/lib/candidate-fields";
import { submitChecklist, type ActionState } from "@/app/checklist/[token]/actions";

export function ChecklistForm({ token, fields }: { token: string; fields: FieldDef[] }) {
  const boundAction = submitChecklist.bind(null, token);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(boundAction, null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [educationHistory, setEducationHistory] = useState(emptyEducationHistory());
  const [hasResumeFile, setHasResumeFile] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const scalarFields = fields.filter((f) => f.type !== "file" && f.type !== "education-history");
  const hasResume = fields.some((f) => f.type === "file");
  const hasEducation = fields.some((f) => f.type === "education-history");

  // Custom validation instead of the browser's default "please fill out this
  // field" popups — every field shows its own "This field is mandatory" text
  // below it (via showError) once a submit attempt reveals it's missing.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const hasEmptyScalar = scalarFields.some((f) => f.required && !(values[f.key] ?? "").trim());
    const missingResume = hasResume && !hasResumeFile;
    const educationEntry1 = educationHistory[0];
    const missingEducation =
      hasEducation &&
      (!educationEntry1.school.trim() ||
        !educationEntry1.degree.trim() ||
        !educationEntry1.major.trim() ||
        !educationEntry1.startDate.trim() ||
        !educationEntry1.endDate.trim());
    if (hasEmptyScalar || missingResume || missingEducation) {
      e.preventDefault();
      setSubmitAttempted(true);
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2.5">
        {scalarFields.map((field) => (
          <DynamicFieldInput
            key={field.key}
            field={field}
            value={values[field.key] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
            showError={submitAttempted}
          />
        ))}

        {hasResume && (
          <ResumeFileUpload
            required
            showRequiredError={submitAttempted}
            onPresenceChange={setHasResumeFile}
          />
        )}
      </div>

      {hasEducation && (
        <EducationHistoryFields
          value={educationHistory}
          onChange={setEducationHistory}
          showError={submitAttempted}
        />
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
