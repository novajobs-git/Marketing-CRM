"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toggleRecruiterStatus, deleteRecruiter, reassignAllProfiles } from "@/app/(app)/admin/users/actions";

const UNASSIGN_VALUE = "__unassign__";

export function RecruiterRowActions({
  userId,
  status,
  assignedCount,
  otherRecruiters,
}: {
  userId: string;
  status: "ACTIVE" | "INACTIVE";
  assignedCount: number;
  otherRecruiters: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState("");
  const [reassignError, setReassignError] = useState<string | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" disabled={pending}>
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={assignedCount === 0}
            onClick={() => {
              setReassignError(null);
              setReassignTarget("");
              setReassignOpen(true);
            }}
          >
            Reassign profiles
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => startTransition(() => void toggleRecruiterStatus(userId))}
          >
            {status === "ACTIVE" ? "Deactivate" : "Reactivate"}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setDeleteError(null);
              setConfirmOpen(true);
            }}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign profiles</DialogTitle>
            <DialogDescription>
              Moves all {assignedCount} profile{assignedCount === 1 ? "" : "s"} currently assigned
              to this recruiter over to whoever you pick below.
            </DialogDescription>
          </DialogHeader>

          {reassignError && <p className="text-sm text-destructive">{reassignError}</p>}

          <Select value={reassignTarget} onValueChange={(v) => setReassignTarget(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Reassign to…">
                {(v: string | null) =>
                  v === UNASSIGN_VALUE
                    ? "Unassign"
                    : (otherRecruiters.find((r) => r.id === v)?.name ?? "Reassign to…")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGN_VALUE}>Unassign</SelectItem>
              {otherRecruiters.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button
              disabled={pending || !reassignTarget}
              onClick={() => {
                const toRecruiterId = reassignTarget === UNASSIGN_VALUE ? null : reassignTarget;
                startTransition(async () => {
                  const result = await reassignAllProfiles(userId, toRecruiterId);
                  if (result?.error) {
                    setReassignError(result.error);
                  } else {
                    setReassignOpen(false);
                  }
                });
              }}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : "Reassign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this recruiter?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the account. Recruiters with historical activity can&apos;t
              be removed — deactivate them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteRecruiter(userId);
                  if (result?.error) {
                    setDeleteError(result.error);
                  } else {
                    setConfirmOpen(false);
                  }
                });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
