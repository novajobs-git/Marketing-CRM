"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Fieldset } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ALL_FIELDS, CHECKLIST_ALWAYS_INCLUDED_KEYS, type FieldDef } from "@/lib/candidate-fields";
import { createChecklistTemplate, type ActionState } from "@/app/(app)/admin/checklists/actions";

const SECTION_LABEL: Partial<Record<FieldDef["section"], string>> = {
  professional: "Professional details",
  education: "Education",
  eeo: "EEO information",
};

// Personal details, target job title, and resume are always collected on
// every checklist link — a template only controls which ADDITIONAL fields
// also get requested.
const SELECTABLE_FIELDS = ALL_FIELDS.filter((f) => !CHECKLIST_ALWAYS_INCLUDED_KEYS.includes(f.key));
const SECTIONS: FieldDef["section"][] = ["professional", "education", "eeo"];

export function CreateChecklistTemplateDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createChecklistTemplate,
    null
  );

  const [lastHandled, setLastHandled] = useState<ActionState>(null);
  if (state !== lastHandled) {
    setLastHandled(state);
    if (state && !state.error) {
      setOpen(false);
      setSelected(new Set());
    }
  }

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        New template
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New checklist template</DialogTitle>
          <DialogDescription>
            Personal details, target job title, and resume are always collected. Choose which
            additional fields this template also requests.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Fieldset>
            <Fieldset.Legend>Template</Fieldset.Legend>
            <Fieldset.Group>
              <div className="flex flex-col gap-2">
                <Label htmlFor="template-name">Template name</Label>
                <Input id="template-name" name="name" required placeholder="e.g. Standard Onboarding" />
              </div>
            </Fieldset.Group>
          </Fieldset>

          {SECTIONS.map((section) => (
            <Fieldset key={section}>
              <Fieldset.Legend className="text-xs tracking-wide uppercase">
                {SECTION_LABEL[section]}
              </Fieldset.Legend>
              <Fieldset.Group className="gap-1.5 space-y-0">
                {SELECTABLE_FIELDS.filter((f) => f.section === section).map((field) => (
                  <label key={field.key} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={selected.has(field.key)}
                      onCheckedChange={() => toggle(field.key)}
                    />
                    {selected.has(field.key) && (
                      <input type="hidden" name="fieldKeys" value={field.key} />
                    )}
                    {field.label}
                  </label>
                ))}
              </Fieldset.Group>
            </Fieldset>
          ))}

          <DialogFooter>
            <Button type="submit" disabled={pending || selected.size === 0}>
              {pending ? "Saving…" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
