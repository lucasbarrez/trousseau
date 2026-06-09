"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-3.5 py-3 text-[15px] leading-[1.6] text-[var(--color-fg)] transition-colors duration-150 ease-out resize-y",
      "placeholder:text-[var(--color-fg-subtle)]",
      "hover:border-[var(--color-fg-subtle)]",
      "focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 focus:outline-none",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
