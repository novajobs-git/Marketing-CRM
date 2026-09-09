"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { LabeledSelect } from "@/components/labeled-select";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
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
      <Field>
        <FieldLabel htmlFor={field.key}>{field.label}</FieldLabel>
        {field.helpText && <FieldDescription>{field.helpText}</FieldDescription>}
        <Textarea
          id={field.key}
          name={field.key}
          rows={2}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }

  if (field.type === "date") {
    return (
      <Field>
        {field.helpText && <FieldDescription>{field.helpText}</FieldDescription>}
        <DatePicker
          name={field.key}
          label={field.label}
          isRequired={field.required}
          value={value}
          onChange={(date) => onChange(date ? date.toString() : "")}
        />
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel htmlFor={field.key}>{field.label}</FieldLabel>
      {field.helpText && <FieldDescription>{field.helpText}</FieldDescription>}
      <Input
        id={field.key}
        name={field.key}
        type={field.type === "number" ? "number" : "text"}
        required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
