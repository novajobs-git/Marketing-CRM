"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DynamicFieldInput } from "@/components/dynamic-field-input";
import { ResumeFileUpload } from "@/components/resume-file-upload";
import { FieldGroup } from "@/components/ui/field";
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

  const scalarFields = fields.filter((f) => f.type !== "file" && f.type !== "education-history");
  const hasResume = fields.some((f) => f.type === "file");
  const hasEducation = fields.some((f) => f.type === "education-history");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        {scalarFields.map((field) => (
          <DynamicFieldInput
            key={field.key}
            field={field}
            value={values[field.key] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
          />
        ))}

        {hasResume && <ResumeFileUpload required />}
      </FieldGroup>

      {hasEducation && (
        <EducationHistoryFields value={educationHistory} onChange={setEducationHistory} />
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
