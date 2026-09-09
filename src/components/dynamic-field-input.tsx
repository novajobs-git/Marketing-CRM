"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import type { FieldDef } from "@/lib/candidate-fields";

function RequiredStar({ required }: { required: boolean }) {
  return required ? <span className="required-star">*</span> : null;
}

function MandatoryError() {
  return <p className="mt-1 text-xs text-destructive">This field is mandatory</p>;
}

/** Renders one scalar candidate field (everything except resume/education-history, which callers special-case). */
export function DynamicFieldInput({
  field,
  value,
  onChange,
  showError = false,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  /** True once the user has attempted to submit — shows "This field is
   *  mandatory" for empty required fields instead of relying on the
   *  browser's native validation popup. */
  showError?: boolean;
}) {
  const isMissing = field.required && !value.trim();
  const labelClassName = cn("floating-label", value && "floating-label--float");

  if (field.type === "select") {
    return (
      <div className="floating-field">
        <select
          id={field.key}
          name={field.key}
          aria-required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="floating-select"
        >
          <option value="" disabled hidden />
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label htmlFor={field.key} className={labelClassName}>
          {field.label}
          <RequiredStar required={field.required} />
        </label>
        {showError && isMissing && <MandatoryError />}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="floating-field">
        <textarea
          id={field.key}
          name={field.key}
          rows={2}
          aria-required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="floating-textarea"
        />
        <label htmlFor={field.key} className={labelClassName}>
          {field.label}
          <RequiredStar required={field.required} />
        </label>
        {showError && isMissing ? (
          <MandatoryError />
        ) : (
          field.helpText && <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
        )}
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
        {showError && isMissing && <MandatoryError />}
      </div>
    );
  }

  return (
    <div className="floating-field">
      <input
        id={field.key}
        name={field.key}
        type={field.type === "number" ? "number" : "text"}
        aria-required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="floating-input"
      />
      <label htmlFor={field.key} className={labelClassName}>
        {field.label}
        <RequiredStar required={field.required} />
      </label>
      {showError && isMissing ? (
        <MandatoryError />
      ) : (
        field.helpText && <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
}
