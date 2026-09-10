"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CandidateDetailFields, type CandidateDetailDefaults } from "@/components/candidate-detail-fields";
import type { ActionState } from "@/app/(app)/candidates/actions";

type Recruiter = { id: string; name: string };

export function CandidateProfileForm({
  action,
  recruiters,
  submitLabel,
  defaultValues,
  defaultAssignedRecruiterId,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  recruiters: Recruiter[];
  submitLabel: string;
  defaultValues?: CandidateDetailDefaults;
  defaultAssignedRecruiterId?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [assignedRecruiterId, setAssignedRecruiterId] = useState(
    defaultAssignedRecruiterId ?? "unassigned"
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label>Assigned recruiter</Label>
        <input
          type="hidden"
          name="assignedRecruiterId"
          value={assignedRecruiterId === "unassigned" ? "" : assignedRecruiterId}
        />
        <Select
          value={assignedRecruiterId}
          onValueChange={(v) => setAssignedRecruiterId(v ?? "unassigned")}
        >
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue>
              {(v: string | null) =>
                v === "unassigned" || !v
                  ? "Unassigned"
                  : (recruiters.find((r) => r.id === v)?.name ?? "Unassigned")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {recruiters.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CandidateDetailFields defaultValues={defaultValues} />

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
