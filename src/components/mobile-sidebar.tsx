"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideNav, type NavItem } from "@/components/side-nav";
import { UserMenu } from "@/components/user-menu";
import { QuickAddMenu } from "@/components/quick-add-menu";

export function MobileSidebar({
  navItems,
  session,
}: {
  navItems: NavItem[];
  session: { name: string; email: string; role: "ADMIN" | "RECRUITER" };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Recruitment CRM
          </span>
        </Link>
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="fixed inset-0 bg-black/20"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-64 flex-col bg-background px-3 py-4 shadow-xl">
            <div className="flex items-center justify-between px-2 py-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Briefcase className="size-4" />
                </span>
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Recruitment CRM
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X />
              </Button>
            </div>

            <div className="mt-4 flex-1" onClick={() => setOpen(false)}>
              <SideNav items={navItems} />
            </div>

            <div className="flex items-center justify-between border-t border-border px-1 pt-3">
              <UserMenu name={session.name} email={session.email} role={session.role} />
              {session.role === "ADMIN" && <QuickAddMenu />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
