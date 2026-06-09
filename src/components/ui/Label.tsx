"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: string; required?: boolean }
>(({ className, children, hint, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "flex items-baseline justify-between gap-3 text-[13px] font-medium text-[var(--color-fg)] mb-1.5",
      className,
    )}
    {...props}
  >
    <span>
      {children}
      {required && (
        <span aria-hidden className="ml-0.5 text-[var(--color-accent)]">*</span>
      )}
    </span>
    {hint && <span className="text-[12px] font-normal text-[var(--color-fg-subtle)]">{hint}</span>}
  </label>
));
Label.displayName = "Label";
