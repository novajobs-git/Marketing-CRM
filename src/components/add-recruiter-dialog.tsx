"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Loader2Icon } from "lucide-react";
import { Fieldset } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createRecruiter, type ActionState } from "@/app/(app)/admin/users/actions";

export function AddRecruiterDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createRecruiter,
    null
  );

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Add recruiter
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add recruiter</DialogTitle>
          <DialogDescription>
            Creates an active recruiter account with a temporary password.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex flex-col gap-6">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state?.success && (
            <Alert>
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}

          <Fieldset>
            <Fieldset.Legend>Recruiter details</Fieldset.Legend>
            <Fieldset.Group>
              <div className="flex flex-col gap-2">
                <Label htmlFor="recruiter-name">Name</Label>
                <Input id="recruiter-name" name="name" required placeholder="Jordan Lee" />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="recruiter-email">Email</Label>
                <Input
                  id="recruiter-email"
                  name="email"
                  type="email"
                  required
                  placeholder="jordan@company.com"
                />
              </div>
            </Fieldset.Group>
          </Fieldset>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" /> : "Create recruiter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
