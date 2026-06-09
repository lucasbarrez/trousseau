"use client";

import { Trash2 } from "lucide-react";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Field, FieldRow, HelperText } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useDossier } from "@/lib/store";
import {
  type Person,
  EMPLOYMENT_STATUSES,
} from "@/lib/types";
import { initials } from "@/lib/utils";

export function PersonForm({
  person,
  index,
}: {
  person: Person;
  index: number;
}) {
  const update = useDossier((s) => s.updatePerson);
  const remove = useDossier((s) => s.removePerson);
  const isGuarantor = person.role === "guarantor";

  const displayName =
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    (isGuarantor ? `Garant ${index + 1}` : `Locataire ${index + 1}`);

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="flex items-center gap-3 -mt-1">
          <div className="w-10 h-10 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-active)] grid place-items-center text-[14px] font-semibold font-[family-name:var(--font-display)] tracking-wider">
            {initials(displayName) || (isGuarantor ? "G" : "L")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-[var(--color-fg)] truncate">
              {displayName}
            </div>
            <div className="text-[12px] text-[var(--color-fg-subtle)]">
              {isGuarantor ? "Garant" : "Locataire"} · {index + 1}
            </div>
          </div>
        </div>

        <FieldRow>
          <Field>
            <Label htmlFor={`firstName-${person.id}`} required>
              Prénom
            </Label>
            <Input
              id={`firstName-${person.id}`}
              value={person.firstName}
              onChange={(e) => update(person.id, { firstName: e.target.value })}
              autoComplete="given-name"
            />
          </Field>
          <Field>
            <Label htmlFor={`lastName-${person.id}`} required>
              Nom
            </Label>
            <Input
              id={`lastName-${person.id}`}
              value={person.lastName}
              onChange={(e) => update(person.id, { lastName: e.target.value })}
              autoComplete="family-name"
            />
          </Field>
        </FieldRow>

        {isGuarantor && (
          <Field>
            <Label htmlFor={`relation-${person.id}`}>
              Lien avec le candidat
            </Label>
            <Input
              id={`relation-${person.id}`}
              placeholder="Père, mère, conjoint·e, employeur…"
              value={person.relationToTenant ?? ""}
              onChange={(e) =>
                update(person.id, { relationToTenant: e.target.value })
              }
            />
          </Field>
        )}

        <FieldRow>
          <Field>
            <Label htmlFor={`employment-${person.id}`}>
              Situation professionnelle
            </Label>
            <Select
              id={`employment-${person.id}`}
              value={person.employmentStatus ?? ""}
              onChange={(e) =>
                update(person.id, {
                  employmentStatus: e.target.value
                    ? (e.target.value as Person["employmentStatus"])
                    : undefined,
                })
              }
            >
              <option value="">Sélectionner…</option>
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor={`income-${person.id}`} hint="€ net / mois">
              Revenus mensuels
            </Label>
            <Input
              id={`income-${person.id}`}
              type="number"
              inputMode="numeric"
              placeholder="2850"
              value={person.monthlyIncome ?? ""}
              onChange={(e) =>
                update(person.id, {
                  monthlyIncome: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field>
            <Label htmlFor={`employer-${person.id}`}>Employeur</Label>
            <Input
              id={`employer-${person.id}`}
              placeholder="Nom de l'entreprise / établissement"
              value={person.employer ?? ""}
              onChange={(e) => update(person.id, { employer: e.target.value })}
              autoComplete="organization"
            />
          </Field>
          <Field>
            <Label htmlFor={`jobTitle-${person.id}`}>Poste / Statut</Label>
            <Input
              id={`jobTitle-${person.id}`}
              placeholder="Chargée de mission"
              value={person.jobTitle ?? ""}
              onChange={(e) => update(person.id, { jobTitle: e.target.value })}
              autoComplete="organization-title"
            />
          </Field>
        </FieldRow>

        <details className="group">
          <summary className="text-[13px] text-[var(--color-fg-muted)] cursor-pointer hover:text-[var(--color-fg)] select-none flex items-center gap-1">
            <span className="inline-block transition-transform group-open:rotate-90">›</span>
            Informations complémentaires
          </summary>
          <div className="mt-4 space-y-5">
            <FieldRow>
              <Field>
                <Label htmlFor={`email-${person.id}`}>Email</Label>
                <Input
                  id={`email-${person.id}`}
                  type="email"
                  value={person.email ?? ""}
                  onChange={(e) =>
                    update(person.id, { email: e.target.value })
                  }
                  autoComplete="email"
                />
              </Field>
              <Field>
                <Label htmlFor={`phone-${person.id}`}>Téléphone</Label>
                <Input
                  id={`phone-${person.id}`}
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={person.phone ?? ""}
                  onChange={(e) =>
                    update(person.id, { phone: e.target.value })
                  }
                  autoComplete="tel"
                />
              </Field>
            </FieldRow>
            <Field>
              <Label htmlFor={`birthDate-${person.id}`}>Date de naissance</Label>
              <Input
                id={`birthDate-${person.id}`}
                type="date"
                value={person.birthDate ?? ""}
                onChange={(e) =>
                  update(person.id, { birthDate: e.target.value })
                }
              />
            </Field>
          </div>
        </details>

        <Field>
          <Label htmlFor={`situation-${person.id}`}>
            Brief de situation
          </Label>
          <Textarea
            id={`situation-${person.id}`}
            rows={3}
            placeholder={
              isGuarantor
                ? "Quelques mots sur la solidité du garant : ancienneté, stabilité, contexte familial…"
                : "Quelques mots sur votre parcours, votre ancienneté, votre projet…"
            }
            value={person.situation ?? ""}
            onChange={(e) => update(person.id, { situation: e.target.value })}
          />
          <HelperText>
            Apparaîtra en synthèse dans la fiche dédiée à cette personne.
          </HelperText>
        </Field>
      </CardBody>

      <CardFooter>
        <span className="text-[12px] text-[var(--color-fg-subtle)]">
          Toutes les informations restent dans votre navigateur.
        </span>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm(`Supprimer ${displayName} ?`)) remove(person.id);
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  );
}
