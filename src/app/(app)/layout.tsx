import Link from "next/link";
import { Briefcase, LayoutDashboard, Users, IdCard, ClipboardList, ListChecks } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SideNav, type NavItem } from "@/components/side-nav";
import { UserMenu } from "@/components/user-menu";
import { QuickAddMenu } from "@/components/quick-add-menu";
import { MobileSidebar } from "@/components/mobile-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { href: "/reports", label: "Daily Reports", icon: <ClipboardList className="size-4" /> },
    ...(session.role === "ADMIN"
      ? [
          { href: "/admin/users", label: "Recruiters", icon: <Users className="size-4" /> },
          { href: "/admin/profiles", label: "Profiles", icon: <IdCard className="size-4" /> },
          { href: "/admin/checklists", label: "Checklists", icon: <ListChecks className="size-4" /> },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <MobileSidebar
        navItems={navItems}
        session={{ name: session.name, email: session.email, role: session.role }}
      />

      <aside className="hidden w-56 shrink-0 flex-col border-r border-border px-3 py-4 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Recruitment CRM
          </span>
        </Link>

        <div className="mt-4 flex-1">
          <SideNav items={navItems} />
        </div>

        <div className="flex items-center justify-between border-t border-border px-1 pt-3">
          <UserMenu name={session.name} email={session.email} role={session.role} />
          {session.role === "ADMIN" && <QuickAddMenu />}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
