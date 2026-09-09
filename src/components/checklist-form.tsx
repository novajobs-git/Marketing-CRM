"use client";

import { useActionState, useState, type FormEvent } from "react";
import { Loader2Icon } from "lucide-react";
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
import { cn } from "@/lib/utils";

type SectionDef = { title: string; rows: string[][] };

// Which fields appear in which section, and how they pair up in a row —
// independent of FieldDef.section (that's the admin template-builder's
// grouping; this is the candidate-facing wizard's layout).
const SECTIONS: SectionDef[] = [
  {
    title: "Personal Details",
    rows: [
      ["name"],
      ["phone"],
      ["email"],
      ["linkedin", "github"],
      ["dob"],
      ["otherLinks"],
      ["address", "addressLine2"],
      ["city", "state", "zipCode"],
    ],
  },
  {
    title: "Career Related Questions",
    rows: [
      ["role", "visaStatus"],
      ["eadEndDate"],
      ["topSkills"],
      ["certifications"],
      ["salaryExpectation"],
      ["jobSearchPriorities"],
      ["resume"],
      ["educationHistory"],
    ],
  },
  {
    title: "EEO and General Questions",
    rows: [
      ["drivingLicense", "openToRelocate"],
      ["preferredCitiesStates"],
      ["gender", "race"],
      ["veteranStatus", "disabilityStatus"],
    ],
  },
];

export function ChecklistForm({ token, fields }: { token: string; fields: FieldDef[] }) {
  const boundAction = submitChecklist.bind(null, token);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(boundAction, null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [educationHistory, setEducationHistory] = useState(emptyEducationHistory());
  const [hasResumeFile, setHasResumeFile] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  const fieldByKey = new Map(fields.map((f) => [f.key, f]));

  // Only keep rows/keys the template actually included for this link.
  const resolvedSections = SECTIONS.map((section) => ({
    ...section,
    rows: section.rows
      .map((row) => row.filter((key) => fieldByKey.has(key)))
      .filter((row) => row.length > 0),
  })).filter((section) => section.rows.length > 0);

  const isLastSection = currentSection === resolvedSections.length - 1;

  function isFieldMissing(key: string): boolean {
    const field = fieldByKey.get(key);
    if (!field || !field.required) return false;
    if (field.type === "file") return !hasResumeFile;
    if (field.type === "education-history") {
      const entry = educationHistory[0];
      return (
        !entry.school.trim() ||
        !entry.degree.trim() ||
        !entry.major.trim() ||
        !entry.startDate.trim() ||
        !entry.endDate.trim()
      );
    }
    return !(values[key] ?? "").trim();
  }

  function currentSectionInvalid(): boolean {
    return resolvedSections[currentSection].rows.some((row) => row.some((key) => isFieldMissing(key)));
  }

  async function advance() {
    if (currentSectionInvalid()) {
      setShowErrors(true);
      return;
    }
    setAdvancing(true);
    // Brief, deliberate pause so moving between sections reads as an
    // action taking effect rather than an instant, jarring cut.
    await new Promise((resolve) => setTimeout(resolve, 550));
    setAdvancing(false);
    setShowErrors(false);
    setCurrentSection((s) => s + 1);
  }

  function handleBack() {
    setShowErrors(false);
    setCurrentSection((s) => Math.max(0, s - 1));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    // Enter key inside any field submits the form natively — on a
    // non-final section that should advance instead of firing the action.
    if (!isLastSection) {
      e.preventDefault();
      void advance();
      return;
    }
    if (currentSectionInvalid()) {
      e.preventDefault();
      setShowErrors(true);
    }
  }

  function renderField(key: string) {
    const field = fieldByKey.get(key);
    if (!field) return null;

    if (field.type === "file") {
      return (
        <ResumeFileUpload
          key={key}
          required
          showRequiredError={showErrors}
          onPresenceChange={setHasResumeFile}
        />
      );
    }

    if (field.type === "education-history") {
      return (
        <EducationHistoryFields
          key={key}
          value={educationHistory}
          onChange={setEducationHistory}
          showError={showErrors}
        />
      );
    }

    return (
      <DynamicFieldInput
        key={key}
        field={field}
        value={values[key] ?? ""}
        onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
        showError={showErrors}
      />
    );
  }

  const progressPercent = ((currentSection + 1) / resolvedSections.length) * 100;

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Step {currentSection + 1} of {resolvedSections.length}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {resolvedSections.map((section, index) => (
        <div
          key={section.title}
          className={cn("flex flex-col gap-5", index !== currentSection && "hidden")}
        >
          <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
          <div className="flex flex-col gap-2.5">
            {section.rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={cn(
                  "grid grid-cols-1 gap-2.5",
                  row.length === 2 && "sm:grid-cols-2",
                  row.length === 3 && "sm:grid-cols-3"
                )}
              >
                {row.map((key) => renderField(key))}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        {currentSection > 0 ? (
          <Button type="button" variant="outline" size="lg" onClick={handleBack} disabled={advancing || pending}>
            Back
          </Button>
        ) : (
          <span />
        )}

        {isLastSection ? (
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Submitting…" : "Submit"}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={() => void advance()} disabled={advancing}>
            {advancing ? <Loader2Icon className="animate-spin" /> : "Next"}
          </Button>
        )}
      </div>
    </form>
  );
}
