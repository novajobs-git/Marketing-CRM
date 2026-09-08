"use client";

import Link from "next/link";
import { Plus, UserPlus, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickAddMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Plus />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem render={<Link href="/candidates/new" />}>
          <UserRoundPlus />
          New candidate profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/admin/users" />}>
          <UserPlus />
          New recruiter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
