"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = {
  id: string;
  label: string;
  shortLabel?: string;
};

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  furthestReached,
}: {
  steps: Step[];
  currentStep: number;
  onStepClick: (idx: number) => void;
  furthestReached: number;
}) {
  return (
    <nav aria-label="Progression du dossier" className="w-full">
      <ol className="flex items-center w-full gap-2">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStep;
          const isPast = idx < currentStep;
          const isReachable = idx <= furthestReached;
          const isLast = idx === steps.length - 1;

          return (
            <li key={step.id} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => isReachable && onStepClick(idx)}
                disabled={!isReachable}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 min-w-0 flex-1 text-left transition-colors duration-150",
                  !isReachable && "opacity-40 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-semibold transition-all duration-200",
                    isCurrent &&
                      "bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent)]/15",
                    isPast &&
                      "bg-[var(--color-accent-active)] text-white",
                    !isCurrent && !isPast &&
                      "bg-[var(--color-bg)] text-[var(--color-fg-subtle)] border border-[var(--color-border-strong)]",
                  )}
                  aria-hidden
                >
                  {isPast ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </span>
                <span className="min-w-0 hidden sm:flex flex-col leading-tight">
                  <span
                    className={cn(
                      "text-[11px] uppercase tracking-wider font-medium",
                      isCurrent
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-fg-subtle)]",
                    )}
                  >
                    Étape {idx + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-medium truncate",
                      isCurrent || isPast
                        ? "text-[var(--color-fg)]"
                        : "text-[var(--color-fg-muted)]",
                    )}
                  >
                    {step.label}
                  </span>
                </span>
                <span className="sm:hidden text-[11px] font-medium text-[var(--color-fg-muted)] truncate">
                  {step.shortLabel ?? step.label}
                </span>
              </button>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-2 h-px flex-1 max-w-12 transition-colors duration-300",
                    isPast
                      ? "bg-[var(--color-accent-active)]"
                      : "bg-[var(--color-border-strong)]",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
