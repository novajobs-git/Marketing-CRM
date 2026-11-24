"use client";

import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ViewOption = { key: string; label: string; count: number };

/** A single dropdown button standing in for a second filter rail — e.g.
 *  Active / Unassigned / Archived — so a list page only ever has one nav
 *  (the app sidebar) instead of two. */
export function ViewsDropdown({
  views,
  activeKey,
  hrefFor,
}: {
  views: ViewOption[];
  activeKey: string;
  hrefFor: (key: string) => string;
}) {
  const router = useRouter();
  const active = views.find((v) => v.key === activeKey);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            {active?.label ?? "All"}
            {active && <span className="text-muted-foreground">{active.count}</span>}
            <ChevronDownIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup
          value={activeKey}
          onValueChange={(value) => {
            if (typeof value === "string") router.push(hrefFor(value));
          }}
        >
          {views.map((v) => (
            <DropdownMenuRadioItem key={v.key} value={v.key}>
              <span className="flex-1">{v.label}</span>
              <span className="text-xs text-muted-foreground">{v.count}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
