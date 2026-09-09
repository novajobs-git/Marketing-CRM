"use client";

import { useActionState, useState } from "react";
import { UserRoundPlus, Copy, Check } from "lucide-react";
import { Fieldset } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createChecklistLink, type CreateLinkState } from "@/app/(app)/admin/checklists/actions";

type Option = { id: string; name: string };

export function CreateChecklistLinkDialog({ templates }: { templates: Option[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState<CreateLinkState, FormData>(
    createChecklistLink,
    null
  );

  const fullUrl = state?.url ? `${window.location.origin}${state.url}` : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCopied(false);
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserRoundPlus />
        Add candidate
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add candidate</DialogTitle>
          <DialogDescription>
            Creates a one-time link for a new candidate to fill out and join the CRM. It stops
            working as soon as they submit.
          </DialogDescription>
        </DialogHeader>

        {state?.url ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertDescription>Link created. Share it with the candidate.</AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={fullUrl}
                className="w-full rounded-lg border border-input bg-muted/50 px-2.5 py-1.5 text-sm text-foreground"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  navigator.clipboard.writeText(fullUrl);
                  setCopied(true);
                }}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-6">
            {state?.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <Fieldset>
              <Fieldset.Legend>Link details</Fieldset.Legend>
              <Fieldset.Group>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="templateId">Template</Label>
                  <select
                    id="templateId"
                    name="templateId"
                    required
                    className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none"
                  >
                    <option value="">Select a template…</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Fieldset.Group>
            </Fieldset>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create link"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
