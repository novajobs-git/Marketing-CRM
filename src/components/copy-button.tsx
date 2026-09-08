"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small icon button, hidden until the surrounding row is hovered — pair with a `group` ancestor. */
export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable in this context — nothing sensible to fall back to
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "group/copy relative inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity outline-none group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50",
        className
      )}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span
        className={cn(
          "pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-background opacity-0 transition-opacity group-hover/copy:opacity-100",
          copied && "opacity-100"
        )}
      >
        {copied ? "Copied!" : "Copy to clipboard"}
      </span>
    </button>
  );
}
