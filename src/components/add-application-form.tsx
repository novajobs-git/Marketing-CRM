"use client";

import { useActionState, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JdEditor } from "@/components/jd-editor";
import type { ActionState } from "@/app/(app)/candidates/[id]/applications/actions";

const STATUS_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function AddApplicationForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [jdContent, setJdContent] = useState<JSONContent>(EMPTY_DOC);
  const [status, setStatus] = useState("APPLIED");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="resume">Tailored resume (PDF)</Label>
        <Input id="resume" name="resume" type="file" accept="application/pdf" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sourceNote">Company / role label (optional)</Label>
        <Input
          id="sourceNote"
          name="sourceNote"
          placeholder="e.g. Acme Corp — Senior Engineer"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Job description</Label>
        <input type="hidden" name="jdContent" value={JSON.stringify(jdContent)} />
        <JdEditor content={jdContent} onChange={setJdContent} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DatePicker
          label="Application date"
          name="appliedDate"
          isRequired
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <input type="hidden" name="status" value={status} />
          <Select value={status} onValueChange={(v) => setStatus(v ?? "APPLIED")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) => STATUS_OPTIONS.find((opt) => opt.value === v)?.label ?? ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save application"}
        </Button>
      </div>
    </form>
  );
}
