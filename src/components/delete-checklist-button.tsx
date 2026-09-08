"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteChecklistTemplate,
  deleteChecklistLink,
} from "@/app/(app)/admin/checklists/actions";

export function DeleteChecklistButton({ kind, id }: { kind: "template" | "link"; id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() =>
        startTransition(() =>
          kind === "template" ? deleteChecklistTemplate(id) : deleteChecklistLink(id)
        )
      }
    >
      <Trash2 />
    </Button>
  );
}
