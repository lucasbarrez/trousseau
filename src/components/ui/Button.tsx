"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-[background-color,box-shadow,transform,color,border-color] duration-150 ease-out disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent)] text-[var(--color-accent-fg)] shadow-[var(--shadow-card)] hover:bg-[var(--color-accent-hover)]",
        secondary:
          "bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg)] hover:border-[var(--color-accent)]",
        ghost:
          "bg-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]",
        soft:
          "bg-[var(--color-accent-soft)] text-[var(--color-accent-active)] hover:bg-[var(--color-accent-soft-hover)]",
        danger:
          "bg-[var(--color-surface)] text-[var(--color-danger)] border border-[var(--color-border)] hover:bg-[var(--color-danger-soft)] hover:border-[var(--color-danger)]",
        link: "text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";
