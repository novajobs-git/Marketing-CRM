"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PencilIcon, Loader2Icon } from "lucide-react";
import { Fieldset } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateReportEntry, type ActionState } from "@/app/(app)/reports/actions";
import type { ReportEntry } from "@/lib/repo/report-entries";

export function EditReportDialog({
  entry,
  candidateId,
}: {
  entry: ReportEntry;
  candidateId: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = updateReportEntry.bind(null, entry.id, candidateId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    boundAction,
    null
  );

  const [lastHandledState, setLastHandledState] = useState<ActionState>(null);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state && !state.error) setOpen(false);
  }

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label="Edit report entry">
        <PencilIcon />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit report entry</DialogTitle>
          <DialogDescription>
            Editable for 8 hours after it was logged. Admins can always correct an entry.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex flex-col gap-6">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Fieldset>
            <Fieldset.Legend>Report entry</Fieldset.Legend>
            <Fieldset.Group>
              <DatePicker
                label="Date"
                name="date"
                isRequired
                defaultValue={entry.date.toISOString().slice(0, 10)}
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="applicationsCount">Applications</Label>
                  <Input
                    id="applicationsCount"
                    name="applicationsCount"
                    type="number"
                    min={0}
                    defaultValue={entry.applicationsCount}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="interviewsCount">Interviews</Label>
                  <Input
                    id="interviewsCount"
                    name="interviewsCount"
                    type="number"
                    min={0}
                    defaultValue={entry.interviewsCount}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="offersCount">Offers</Label>
                  <Input
                    id="offersCount"
                    name="offersCount"
                    type="number"
                    min={0}
                    defaultValue={entry.offersCount}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Optional notes…"
                  defaultValue={entry.notes ?? ""}
                />
              </div>
            </Fieldset.Group>
          </Fieldset>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
