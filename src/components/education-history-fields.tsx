"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { EMPTY_EDUCATION_ENTRY, type EducationEntry } from "@/lib/candidate-fields";

function MandatoryError() {
  return <p className="text-xs text-destructive">This field is mandatory</p>;
}

function Entry({
  index,
  required,
  value,
  onChange,
  showError,
}: {
  index: 1 | 2;
  required: boolean;
  value: EducationEntry;
  onChange: (next: EducationEntry) => void;
  showError: boolean;
}) {
  function set<K extends keyof EducationEntry>(key: K, v: string) {
    onChange({ ...value, [key]: v });
  }

  const missing = required && showError
    ? {
        school: !value.school.trim(),
        degree: !value.degree.trim(),
        major: !value.major.trim(),
        startDate: !value.startDate.trim(),
        endDate: !value.endDate.trim(),
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-foreground">Education {index}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>School/University{required && " *"}</Label>
          <Input required={required} value={value.school} onChange={(e) => set("school", e.target.value)} />
          {missing?.school && <MandatoryError />}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Degree{required && " *"}</Label>
          <Input required={required} value={value.degree} onChange={(e) => set("degree", e.target.value)} />
          {missing?.degree && <MandatoryError />}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Major{required && " *"}</Label>
          <Input required={required} value={value.major} onChange={(e) => set("major", e.target.value)} />
          {missing?.major && <MandatoryError />}
        </div>
        <div className="flex flex-col gap-2">
          <Label>GPA</Label>
          <Input value={value.gpa} onChange={(e) => set("gpa", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <DatePicker
            label="Start Date"
            isRequired={required}
            value={value.startDate}
            onChange={(date) => set("startDate", date ? date.toString() : "")}
          />
          {missing?.startDate && <MandatoryError />}
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <DatePicker
            label="End Date"
            isRequired={required}
            value={value.endDate}
            onChange={(date) => set("endDate", date ? date.toString() : "")}
          />
          {missing?.endDate && <MandatoryError />}
        </div>
      </div>
    </div>
  );
}

export function EducationHistoryFields({
  value,
  onChange,
  showError = false,
}: {
  value: [EducationEntry, EducationEntry];
  onChange: (next: [EducationEntry, EducationEntry]) => void;
  showError?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <input type="hidden" name="educationHistory" value={JSON.stringify(value)} />
      <Entry
        index={1}
        required
        value={value[0]}
        onChange={(entry) => onChange([entry, value[1]])}
        showError={showError}
      />
      <Entry
        index={2}
        required={false}
        value={value[1]}
        onChange={(entry) => onChange([value[0], entry])}
        showError={showError}
      />
    </div>
  );
}

export function emptyEducationHistory(): [EducationEntry, EducationEntry] {
  return [{ ...EMPTY_EDUCATION_ENTRY }, { ...EMPTY_EDUCATION_ENTRY }];
}
