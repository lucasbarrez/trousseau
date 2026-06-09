"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full appearance-none rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border-strong)] pl-3.5 pr-9 py-2 text-[15px] text-[var(--color-fg)] transition-colors duration-150 ease-out",
        "hover:border-[var(--color-fg-subtle)]",
        "focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 focus:outline-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-fg-subtle)]"
    />
  </div>
));
Select.displayName = "Select";
