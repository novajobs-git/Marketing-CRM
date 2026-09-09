"use client";

import { useId } from "react";
import { FileTextIcon, UploadCloudIcon, XIcon, CircleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { RESUME_ACCEPT, RESUME_MAX_BYTES } from "@/lib/file-validation";

export function ResumeFileUpload({
  name = "resume",
  label = "Resume",
  required = false,
  existingFilename,
  className,
  showRequiredError,
  onPresenceChange,
}: {
  name?: string;
  label?: string;
  required?: boolean;
  existingFilename?: string;
  className?: string;
  /** Opt-in: when provided (even `false`), native browser validation is
   *  suppressed for this field and a "This field is mandatory" message is
   *  shown instead whenever true — used by forms that want a consistent
   *  custom validation UX instead of the browser's default popup. */
  showRequiredError?: boolean;
  onPresenceChange?: (hasFile: boolean) => void;
}) {
  const inputId = useId();
  const useCustomValidation = showRequiredError !== undefined;
  const [
    { files, isDragging, errors },
    { removeFile, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps },
  ] = useFileUpload({
    accept: RESUME_ACCEPT,
    maxSize: RESUME_MAX_BYTES,
    multiple: false,
    onFilesChange: (nextFiles) => onPresenceChange?.(nextFiles.length > 0),
  });

  const selected = files[0];
  const isMissing = required && !existingFilename && !selected;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={inputId}>
        {label}
        {existingFilename ? " — replace" : ""}
      </Label>
      {existingFilename && !selected && (
        <p className="text-xs text-muted-foreground">
          Current file: {existingFilename}. Leave blank to keep it.
        </p>
      )}

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input
          {...getInputProps({
            id: inputId,
            name,
            required: useCustomValidation ? false : required && !existingFilename,
          })}
          className="sr-only"
        />

        {selected ? (
          <div
            className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <FileTextIcon className="size-8 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{selected.file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(selected.file.size)}</p>
            </div>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => removeFile(selected.id)}>
              <XIcon className="size-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <UploadCloudIcon className={cn("size-8", isDragging ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm text-foreground">
              <span className="font-medium text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PDF or DOCX, up to 5MB</p>
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              Browse files
            </Button>
          </>
        )}
      </div>

      {useCustomValidation && showRequiredError && isMissing && (
        <div className="flex items-start gap-1.5 text-sm text-destructive">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <p>This field is mandatory</p>
        </div>
      )}

      {errors.length > 0 && (
        <div className="flex items-start gap-1.5 text-sm text-destructive">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <div>
            {errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
