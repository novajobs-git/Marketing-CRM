"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { LabeledSelect } from "@/components/labeled-select";
import type { FieldDef } from "@/lib/candidate-fields";

/** Renders one scalar candidate field (everything except resume/education-history, which callers special-case). */
export function DynamicFieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "select") {
    return (
      <LabeledSelect
        name={field.key}
        label={field.label}
        value={value}
        onChange={onChange}
        options={field.options ?? []}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        <Textarea
          id={field.key}
          name={field.key}
          rows={2}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div className="flex flex-col gap-2">
        {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        <DatePicker
          name={field.key}
          label={field.label}
          isRequired={field.required}
          value={value}
          onChange={(date) => onChange(date ? date.toString() : "")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.key}>{field.label}</Label>
      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
      <Input
        id={field.key}
        name={field.key}
        type={field.type === "number" ? "number" : "text"}
        required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
