"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-3.5 py-2 text-[15px] text-[var(--color-fg)] transition-colors duration-150 ease-out",
      "placeholder:text-[var(--color-fg-subtle)]",
      "hover:border-[var(--color-fg-subtle)]",
      "focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 focus:outline-none",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
