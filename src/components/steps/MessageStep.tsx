"use client";

import { Mail, Sparkles } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { HelperText } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StepHeader } from "@/components/StepHeader";
import { useDossier } from "@/lib/store";

const messageTemplate = `Madame, Monsieur,

Je vous adresse mon dossier de candidature pour la location du bien situé à [Adresse].

Mon profil et celui de mes garants répondent aux critères de solvabilité habituellement demandés. Vous trouverez l'ensemble des pièces justificatives dans les pages qui suivent, classées par section pour faciliter votre lecture.

Je reste disponible pour toute information complémentaire ou pour une visite, et vous remercie par avance de l'attention portée à ma candidature.

Bien cordialement,`;

const situationTemplate = `Locataire(s) — Décrivez votre activité, votre stabilité et vos revenus en quelques phrases (ex. : "En CDI chez ABC depuis mars 2022 en qualité de chargée de mission, revenus mensuels nets de 2 850 €.").

Garant(s) — Présentez votre/vos garant(s) : lien, situation pro et revenus (ex. : "Mes parents se portent garants conjointement, tous deux fonctionnaires en CDI, revenus nets cumulés de 6 200 €.").`;

export function MessageStep() {
  const dossier = useDossier((s) => s.dossier);
  const setMessage = useDossier((s) => s.setMessage);

  const fillTemplateMessage = () => {
    if (
      !dossier.messageToAgency ||
      confirm("Remplacer le message actuel par le modèle ?")
    ) {
      setMessage({ messageToAgency: messageTemplate });
    }
  };

  const fillTemplateSituation = () => {
    if (
      !dossier.situationSummary ||
      confirm("Remplacer le résumé actuel par le modèle ?")
    ) {
      setMessage({ situationSummary: situationTemplate });
    }
  };

  return (
    <div className="step-in">
      <StepHeader
        eyebrow="Étape 2 sur 6"
        icon={<Mail className="w-5 h-5" />}
        title="Mot d'introduction"
        description="Un message court et soigné en début de dossier change tout : il personnalise votre candidature et donne envie de lire la suite. Restez sincère et factuel."
      />

      <div className="space-y-6">
        <Card>
          <CardBody>
            <div className="flex items-baseline justify-between mb-1.5 gap-3">
              <Label htmlFor="messageToAgency" className="mb-0">
                Message à l&apos;agence ou au propriétaire
              </Label>
              <Button variant="link" size="sm" onClick={fillTemplateMessage}>
                <Sparkles className="w-3 h-3" />
                Insérer un modèle
              </Button>
            </div>
            <Textarea
              id="messageToAgency"
              rows={9}
              placeholder="Quelques lignes pour vous présenter et exprimer votre intérêt pour le bien…"
              value={dossier.messageToAgency}
              onChange={(e) => setMessage({ messageToAgency: e.target.value })}
            />
            <HelperText>
              Conseil : 4 à 8 lignes suffisent. Adressez-vous nommément si vous connaissez l&apos;interlocuteur.
            </HelperText>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-baseline justify-between mb-1.5 gap-3">
              <Label htmlFor="situationSummary" className="mb-0">
                Résumé de votre situation
              </Label>
              <Button variant="link" size="sm" onClick={fillTemplateSituation}>
                <Sparkles className="w-3 h-3" />
                Insérer un modèle
              </Button>
            </div>
            <Textarea
              id="situationSummary"
              rows={8}
              placeholder="Synthèse en 1 paragraphe de la situation des locataires et garants."
              value={dossier.situationSummary}
              onChange={(e) =>
                setMessage({ situationSummary: e.target.value })
              }
            />
            <HelperText>
              Apparaîtra juste avant le sommaire. Donnez le contexte global pour rassurer en 30 secondes.
            </HelperText>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
