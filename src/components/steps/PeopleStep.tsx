"use client";

import { Plus, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StepHeader } from "@/components/StepHeader";
import { PersonForm } from "./PersonForm";
import { useDossier } from "@/lib/store";
import type { PersonRole } from "@/lib/types";

const COPY = {
  tenant: {
    eyebrow: "Étape 3 sur 6",
    title: "Locataires candidats",
    description:
      "Renseignez chaque personne qui figurera sur le bail. Toutes les zones non obligatoires peuvent rester vides — vous pouvez aussi enrichir plus tard.",
    addLabel: "Ajouter un locataire",
    emptyTitle: "Aucun locataire renseigné",
    emptyDescription:
      "Démarrez avec le candidat principal. Si vous candidatez en couple ou en colocation, ajoutez les autres ensuite.",
    icon: <Users className="w-5 h-5" />,
  },
  guarantor: {
    eyebrow: "Étape 4 sur 6",
    title: "Garants",
    description:
      "Présentez la ou les personnes qui se portent garantes. Idéalement, le revenu cumulé de vos garants atteint 3 fois le loyer.",
    addLabel: "Ajouter un garant",
    emptyTitle: "Pas de garant",
    emptyDescription:
      "Vous n'avez pas de garant ? C'est ok, vous pouvez passer à l'étape suivante.",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
} as const;

export function PeopleStep({ role }: { role: PersonRole }) {
  const dossier = useDossier((s) => s.dossier);
  const addPerson = useDossier((s) => s.addPerson);
  const people = role === "tenant" ? dossier.tenants : dossier.guarantors;
  const copy = COPY[role];

  return (
    <div className="step-in">
      <StepHeader
        eyebrow={copy.eyebrow}
        icon={copy.icon}
        title={copy.title}
        description={copy.description}
      />

      <div className="space-y-5">
        {people.length === 0 ? (
          <EmptyState
            title={copy.emptyTitle}
            description={copy.emptyDescription}
            icon={copy.icon}
            actionLabel={copy.addLabel}
            onAction={() => addPerson(role)}
          />
        ) : (
          <>
            {people.map((p, idx) => (
              <PersonForm key={p.id} person={p} index={idx} />
            ))}

            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => addPerson(role)}>
                <Plus className="w-4 h-4" />
                {copy.addLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[14px] bg-[var(--color-surface)] border border-dashed border-[var(--color-border-strong)] py-12 px-6 text-center">
      <div className="inline-grid mx-auto w-12 h-12 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-active)] place-items-center mb-4">
        {icon}
      </div>
      <h3 className="text-[16px] font-semibold text-[var(--color-fg)]">
        {title}
      </h3>
      <p className="mt-1.5 text-[14px] text-[var(--color-fg-muted)] max-w-md mx-auto">
        {description}
      </p>
      <div className="mt-5">
        <Button onClick={onAction}>
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
