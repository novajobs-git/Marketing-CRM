"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { archiveCandidateProfile, unarchiveCandidateProfile } from "@/app/(app)/candidates/actions";

export function ArchiveProfileButton({
  candidateId,
  isArchived,
}: {
  candidateId: string;
  isArchived: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isArchived) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => unarchiveCandidateProfile(candidateId))}
      >
        Unarchive
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={pending} />}>
        Archive
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this profile?</AlertDialogTitle>
          <AlertDialogDescription>
            The profile is hidden from active lists but all historical application data is kept.
            You can unarchive it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => startTransition(() => archiveCandidateProfile(candidateId))}
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
