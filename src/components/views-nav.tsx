import Link from "next/link";
import { cn } from "@/lib/utils";

export type ViewItem = { key: string; label: string; count: number };

/**
 * Renders as a fixed-width left column from `md` up, and as a horizontal
 * scrollable pill row above the content below `md` — same nav, two layouts,
 * so list pages don't lose their filters on narrow screens.
 */
export function ViewsNav({
  views,
  activeKey,
  hrefFor,
}: {
  views: ViewItem[];
  activeKey: string;
  hrefFor: (key: string) => string;
}) {
  return (
    <>
      <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 md:hidden">
        {views.map((v) => {
          const active = v.key === activeKey;
          return (
            <Link
              key={v.key}
              href={hrefFor(v.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {v.label} <span className="text-xs">{v.count}</span>
            </Link>
          );
        })}
      </nav>

      <aside className="hidden w-52 shrink-0 border-r border-border px-3 py-8 md:flex md:flex-col">
        <h2 className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Views
        </h2>
        <nav className="mt-2 flex flex-col gap-0.5">
          {views.map((v) => {
            const active = v.key === activeKey;
            return (
              <Link
                key={v.key}
                href={hrefFor(v.key)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {v.label}
                <span className="text-xs text-muted-foreground">{v.count}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
