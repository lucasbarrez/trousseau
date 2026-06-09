"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Stepper, type Step } from "@/components/Stepper";
import { StepNav } from "@/components/StepNav";
import { CoverStep } from "@/components/steps/CoverStep";
import { MessageStep } from "@/components/steps/MessageStep";
import { PeopleStep } from "@/components/steps/PeopleStep";
import { DocumentsStep } from "@/components/steps/DocumentsStep";
import { PreviewStep } from "@/components/steps/PreviewStep";
import { useDossier } from "@/lib/store";

const STEPS: Step[] = [
  { id: "cover", label: "Couverture", shortLabel: "Couverture" },
  { id: "intro", label: "Introduction", shortLabel: "Intro" },
  { id: "tenants", label: "Locataires", shortLabel: "Locataires" },
  { id: "guarantors", label: "Garants", shortLabel: "Garants" },
  { id: "documents", label: "Documents", shortLabel: "Documents" },
  { id: "preview", label: "Aperçu & PDF", shortLabel: "Aperçu" },
];

export default function Home() {
  const currentStep = useDossier((s) => s.currentStep);
  const setStep = useDossier((s) => s.setStep);
  const goNext = useDossier((s) => s.goNext);
  const goPrev = useDossier((s) => s.goPrev);
  const dossier = useDossier((s) => s.dossier);

  const furthest = useMemo(() => STEPS.length - 1, []);

  const canGoNext = useMemo(() => {
    if (currentStep === 0) {
      return (
        dossier.applicantName.trim().length > 0 &&
        dossier.city.trim().length > 0
      );
    }
    return true;
  }, [currentStep, dossier.applicantName, dossier.city]);

  const stepContent = (() => {
    switch (currentStep) {
      case 0:
        return <CoverStep />;
      case 1:
        return <MessageStep />;
      case 2:
        return <PeopleStep role="tenant" />;
      case 3:
        return <PeopleStep role="guarantor" />;
      case 4:
        return <DocumentsStep />;
      case 5:
        return <PreviewStep />;
      default:
        return null;
    }
  })();

  const hints = [
    "Renseignez au moins le nom et la ville pour continuer.",
    "Étape facultative — vous pouvez la passer.",
    "Ajoutez les personnes qui figureront sur le bail.",
    "Vous pouvez ne pas avoir de garant.",
    "Glissez vos fichiers dans la zone de la personne concernée.",
    "",
  ];

  return (
    <AppShell>
      <div className="rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-4 sm:p-5 mb-8">
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={setStep}
          furthestReached={furthest}
        />
      </div>

      <div key={`${dossier.id}-${currentStep}`}>{stepContent}</div>

      {currentStep < STEPS.length - 1 ? (
        <StepNav
          onPrev={currentStep > 0 ? goPrev : undefined}
          onNext={goNext}
          canGoNext={canGoNext}
          hint={hints[currentStep]}
        />
      ) : (
        <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={goPrev}
            className="text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
          >
            ← Revenir à l&apos;étape précédente
          </button>
        </div>
      )}
    </AppShell>
  );
}
