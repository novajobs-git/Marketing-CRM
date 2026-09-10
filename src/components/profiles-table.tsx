"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InitialsAvatar } from "@/components/initials-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bulkArchiveCandidateProfiles,
  bulkReassignCandidateProfiles,
} from "@/app/(app)/candidates/actions";

const UNASSIGN_VALUE = "__unassign__";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  UNASSIGNED: "Unassigned",
  ARCHIVED: "Archived",
};

export type ProfileRow = {
  id: string;
  name: string;
  role: string;
  status: string;
  assignedRecruiter: { name: string } | null;
};

export function ProfilesTable({
  profiles,
  recruiters,
  canManage = false,
}: {
  profiles: ProfileRow[];
  recruiters: { id: string; name: string }[];
  /** Bulk archive/reassign is an admin-only action — recruiters get a
   *  read-only view of the same table (no checkboxes, no bulk-action bar). */
  canManage?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reassignTarget, setReassignTarget] = useState("");
  const [pending, startTransition] = useTransition();

  const allSelected = profiles.length > 0 && selected.size === profiles.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(profiles.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function archiveSelected() {
    startTransition(async () => {
      await bulkArchiveCandidateProfiles([...selected]);
      setSelected(new Set());
      router.refresh();
    });
  }

  function reassignSelected() {
    if (!reassignTarget) return;
    const recruiterId = reassignTarget === UNASSIGN_VALUE ? null : reassignTarget;
    startTransition(async () => {
      await bulkReassignCandidateProfiles([...selected], recruiterId);
      setSelected(new Set());
      setReassignTarget("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {canManage && selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm text-foreground">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <Select value={reassignTarget} onValueChange={(v) => setReassignTarget(v ?? "")}>
              <SelectTrigger className="w-44" size="sm">
                <SelectValue placeholder="Reassign to…">
                  {(v: string | null) =>
                    v === UNASSIGN_VALUE
                      ? "Unassign"
                      : (recruiters.find((r) => r.id === v)?.name ?? "Reassign to…")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGN_VALUE}>Unassign</SelectItem>
                {recruiters.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={pending || !reassignTarget}
              onClick={reassignSelected}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : "Reassign"}
            </Button>
            <Button variant="outline" size="sm" disabled={pending} onClick={archiveSelected}>
              {pending ? <Loader2Icon className="animate-spin" /> : "Archive selected"}
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {canManage && (
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
              </TableHead>
            )}
            <TableHead className="w-[32%]">Name</TableHead>
            <TableHead className="w-[18%]">Role</TableHead>
            <TableHead className="w-[28%]">Assigned recruiter</TableHead>
            <TableHead className="w-[15%]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={canManage ? 5 : 4} className="py-10 text-center text-muted-foreground">
                No profiles match.
              </TableCell>
            </TableRow>
          )}
          {profiles.map((profile) => (
            <TableRow key={profile.id} data-state={selected.has(profile.id) ? "selected" : undefined}>
              {canManage && (
                <TableCell>
                  <Checkbox
                    checked={selected.has(profile.id)}
                    onCheckedChange={() => toggleOne(profile.id)}
                    aria-label={`Select ${profile.name}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium text-foreground">
                <Link href={`/candidates/${profile.id}`} prefetch className="flex min-w-0 items-center gap-2">
                  <InitialsAvatar name={profile.name} />
                  <span className="truncate">{profile.name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Link href={`/candidates/${profile.id}`} prefetch className="flex min-w-0 items-center">
                  <span className="truncate">{profile.role}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Link href={`/candidates/${profile.id}`} prefetch className="flex min-w-0 items-center gap-2">
                  {profile.assignedRecruiter ? (
                    <>
                      <InitialsAvatar name={profile.assignedRecruiter.name} />
                      <span className="truncate">{profile.assignedRecruiter.name}</span>
                    </>
                  ) : (
                    <span className="truncate">Unassigned</span>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/candidates/${profile.id}`} prefetch className="flex items-center">
                  <Badge variant={profile.status === "ARCHIVED" ? "outline" : "secondary"}>
                    {STATUS_LABEL[profile.status]}
                  </Badge>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
