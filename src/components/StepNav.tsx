"use client";

import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { Button } from "./ui/Button";

export function StepNav({
  onPrev,
  onNext,
  prevLabel = "Précédent",
  nextLabel = "Suivant",
  isLast = false,
  canGoNext = true,
  onFinish,
  hint,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  isLast?: boolean;
  canGoNext?: boolean;
  onFinish?: () => void;
  hint?: string;
}) {
  return (
    <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div>
        {onPrev && (
          <Button variant="ghost" onClick={onPrev}>
            <ArrowLeft className="w-4 h-4" />
            {prevLabel}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {hint && (
          <span className="text-[12px] text-[var(--color-fg-subtle)] hidden md:inline">
            {hint}
          </span>
        )}
        {isLast ? (
          <Button onClick={onFinish} disabled={!canGoNext} size="lg">
            <Download className="w-4 h-4" />
            Générer le PDF
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!canGoNext} size="lg">
            {nextLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
