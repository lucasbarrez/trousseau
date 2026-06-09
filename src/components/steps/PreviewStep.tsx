"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Download,
  FileCheck2,
  FileStack,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepHeader } from "@/components/StepHeader";
import { useDossier } from "@/lib/store";
import {
  type GenerateProgress,
  downloadBlob,
  generateDossierPdf,
} from "@/lib/pdf/generate";
import { cn, formatBytes, initials } from "@/lib/utils";
import type { Person } from "@/lib/types";

export function PreviewStep() {
  const dossier = useDossier((s) => s.dossier);
  const saveNow = useDossier((s) => s.saveNow);
  const setShowPersonInfo = useDossier((s) => s.setShowPersonInfo);
  const showPersonInfo = dossier.showPersonInfo !== false;
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerateProgress | null>(null);
  const [done, setDone] = useState<{ blob: Blob; filename: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const totalFiles =
    dossier.commonFiles.length +
    dossier.tenantCommonFiles.length +
    dossier.guarantorCommonFiles.length +
    dossier.tenants.reduce((n, t) => n + t.files.length, 0) +
    dossier.guarantors.reduce((n, g) => n + g.files.length, 0);

  const totalSize =
    dossier.commonFiles.reduce((n, f) => n + f.size, 0) +
    dossier.tenantCommonFiles.reduce((n, f) => n + f.size, 0) +
    dossier.guarantorCommonFiles.reduce((n, f) => n + f.size, 0) +
    dossier.tenants.reduce(
      (sum, t) => sum + t.files.reduce((n, f) => n + f.size, 0),
      0,
    ) +
    dossier.guarantors.reduce(
      (sum, g) => sum + g.files.reduce((n, f) => n + f.size, 0),
      0,
    );

  const filename = `Dossier_${(dossier.applicantName || "candidat")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")}_${new Date().toISOString().slice(0, 10)}.pdf`;

  const canGenerate =
    dossier.applicantName.trim().length > 0 && totalFiles > 0;

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;
    setGenerating(true);
    setError(null);
    setDone(null);
    setProgress({ stage: "computing", ratio: 0 });
    try {
      await saveNow();
      const blob = await generateDossierPdf(dossier, setProgress);
      setDone({ blob, filename });
      downloadBlob(blob, filename);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Une erreur est survenue.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="step-in">
      <StepHeader
        eyebrow="Étape 6 sur 6"
        icon={<FileCheck2 className="w-5 h-5" />}
        title="Aperçu et génération"
        description="Tout est prêt. Vérifiez le récap, puis générez le PDF. Le fichier est assemblé localement dans votre navigateur, sans aucun envoi externe."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <Card>
          <CardBody className="space-y-7">
            <Section
              eyebrow="Couverture"
              title={dossier.applicantName || "Nom à compléter"}
            >
              <Row icon={<MapPin className="w-3.5 h-3.5" />}>
                {dossier.city || "Ville à compléter"}
                {dossier.propertyDescription && (
                  <>
                    <span className="opacity-40 mx-1.5">·</span>
                    <span className="italic">{dossier.propertyDescription}</span>
                  </>
                )}
              </Row>
              <Row icon={<Sparkles className="w-3.5 h-3.5" />}>
                {dossier.title}
              </Row>
            </Section>

            {(dossier.messageToAgency.trim() ||
              dossier.situationSummary.trim()) && (
              <Section eyebrow="Présentation" title="Mot d'introduction">
                {dossier.messageToAgency.trim() ? (
                  <p className="text-[14px] leading-relaxed text-[var(--color-fg-muted)] whitespace-pre-line line-clamp-6 italic font-[family-name:var(--font-serif)]">
                    « {dossier.messageToAgency.trim()} »
                  </p>
                ) : (
                  <p className="text-[13px] italic text-[var(--color-fg-subtle)]">
                    Aucun message renseigné.
                  </p>
                )}
                {dossier.situationSummary.trim() && (
                  <p className="mt-3 pt-3 border-t border-[var(--color-border)] text-[13px] text-[var(--color-fg-muted)] whitespace-pre-line line-clamp-4">
                    {dossier.situationSummary.trim()}
                  </p>
                )}
              </Section>
            )}

            <Section
              eyebrow="Structure du dossier"
              title={`${totalFiles} document${totalFiles > 1 ? "s" : ""}`}
            >
              <div className="space-y-2">
                {dossier.commonFiles.length > 0 && (
                  <SummaryGroup
                    icon={
                      <div className="w-7 h-7 rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent-active)] grid place-items-center shrink-0">
                        <FileStack className="w-3.5 h-3.5" />
                      </div>
                    }
                    title="Documents communs"
                    subtitle={`${dossier.commonFiles.length} fichier${dossier.commonFiles.length > 1 ? "s" : ""}`}
                    files={dossier.commonFiles.map((f) => f.name)}
                  />
                )}

                {dossier.tenantCommonFiles.length > 0 && (
                  <SummaryGroup
                    icon={
                      <div className="w-7 h-7 rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent-active)] grid place-items-center shrink-0">
                        <FileStack className="w-3.5 h-3.5" />
                      </div>
                    }
                    title="Documents communs locataires"
                    subtitle={`${dossier.tenantCommonFiles.length} fichier${dossier.tenantCommonFiles.length > 1 ? "s" : ""}`}
                    files={dossier.tenantCommonFiles.map((f) => f.name)}
                  />
                )}

                {dossier.tenants.map((p, idx) => (
                  <PersonSummary
                    key={p.id}
                    person={p}
                    label="Locataire"
                    index={idx + 1}
                  />
                ))}

                {dossier.guarantorCommonFiles.length > 0 && (
                  <SummaryGroup
                    icon={
                      <div className="w-7 h-7 rounded-md bg-[#FEF3C7] text-[#92400E] grid place-items-center shrink-0">
                        <FileStack className="w-3.5 h-3.5" />
                      </div>
                    }
                    title="Documents communs garants"
                    subtitle={`${dossier.guarantorCommonFiles.length} fichier${dossier.guarantorCommonFiles.length > 1 ? "s" : ""}`}
                    files={dossier.guarantorCommonFiles.map((f) => f.name)}
                  />
                )}

                {dossier.guarantors.map((p, idx) => (
                  <PersonSummary
                    key={p.id}
                    person={p}
                    label="Garant"
                    index={idx + 1}
                  />
                ))}

                {dossier.tenants.length === 0 &&
                  dossier.guarantors.length === 0 &&
                  dossier.commonFiles.length === 0 &&
                  dossier.tenantCommonFiles.length === 0 &&
                  dossier.guarantorCommonFiles.length === 0 && (
                    <p className="text-[13px] italic text-[var(--color-fg-subtle)] px-1">
                      Aucun document pour le moment.
                    </p>
                  )}
              </div>
            </Section>
          </CardBody>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-medium text-[var(--color-accent)]">
                  Récapitulatif
                </p>
                <h3 className="mt-1 text-[18px] font-[family-name:var(--font-display)] text-[var(--color-fg)]">
                  Génération du dossier
                </h3>
              </div>

              <dl className="space-y-2.5 text-[13px]">
                <Stat
                  label="Fichiers"
                  value={`${totalFiles}`}
                  hint={totalFiles > 0 ? formatBytes(totalSize) : undefined}
                />
                <Stat
                  label="Locataires"
                  value={`${dossier.tenants.length}`}
                />
                <Stat
                  label="Garants"
                  value={`${dossier.guarantors.length}`}
                />
              </dl>

              <label className="flex items-start gap-2.5 pt-3 border-t border-[var(--color-border)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPersonInfo}
                  onChange={(e) => setShowPersonInfo(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]/30 cursor-pointer"
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium text-[var(--color-fg)]">
                    Afficher le résumé par personne
                  </span>
                  <span className="block text-[12px] text-[var(--color-fg-subtle)] leading-snug mt-0.5">
                    Inclut poste, employeur, revenus et situation sur la page d&apos;intercalaire de chaque personne.
                  </span>
                </span>
              </label>

              <div className="pt-3 border-t border-[var(--color-border)]">
                {!canGenerate ? (
                  <div className="text-[12px] text-[var(--color-warning)] bg-[var(--color-warning-soft)] border border-[color-mix(in_oklab,var(--color-warning)_30%,transparent)] rounded-[10px] px-3 py-2.5">
                    {dossier.applicantName.trim().length === 0
                      ? "Ajoutez un nom de candidat (étape 1) pour générer le PDF."
                      : "Ajoutez au moins un fichier (étape 5) pour générer le PDF."}
                  </div>
                ) : null}

                <Button
                  size="lg"
                  className="w-full mt-3"
                  disabled={!canGenerate || generating}
                  onClick={handleGenerate}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération en cours…
                    </>
                  ) : done ? (
                    <>
                      <Download className="w-4 h-4" />
                      Télécharger à nouveau
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Générer & télécharger
                    </>
                  )}
                </Button>

                {progress && (generating || done) && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-[var(--color-bg)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] transition-all duration-300 ease-out"
                        style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[12px] text-[var(--color-fg-subtle)] flex items-center gap-1.5">
                      {progress.stage === "done" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          PDF prêt — vérifiez vos téléchargements.
                        </>
                      ) : (
                        progress.detail
                      )}
                    </p>
                  </div>
                )}

                {error && (
                  <p className="mt-3 text-[12px] text-[var(--color-danger)] bg-[var(--color-danger-soft)] border border-[color-mix(in_oklab,var(--color-danger)_30%,transparent)] rounded-[10px] px-3 py-2.5">
                    {error}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <p className="text-[11px] text-[var(--color-fg-subtle)] leading-relaxed px-1">
            Le PDF est composé entièrement dans votre navigateur. Vos fichiers
            ne transitent par aucun serveur.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-[var(--color-fg-subtle)]">
        {eyebrow}
      </p>
      <h3 className="mt-1 mb-3 text-[18px] font-[family-name:var(--font-display)] text-[var(--color-fg)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[var(--color-fg-muted)] mb-1">
      <span className="text-[var(--color-fg-subtle)]">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function PersonSummary({
  person,
  label,
  index,
}: {
  person: Person;
  label: string;
  index: number;
}) {
  const name = `${person.firstName} ${person.lastName}`.trim() || label;
  return (
    <SummaryGroup
      icon={
        <div
          className={cn(
            "w-7 h-7 rounded-full grid place-items-center shrink-0 text-[10px] font-semibold tracking-wider",
            label === "Locataire"
              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-active)]"
              : "bg-[#FEF3C7] text-[#92400E]",
          )}
        >
          {label === "Locataire" ? (
            <User className="w-3.5 h-3.5" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
        </div>
      }
      title={name}
      eyebrow={`${label} ${index}`}
      subtitle={`${person.files.length} fichier${person.files.length > 1 ? "s" : ""}`}
      files={person.files.map((f) => f.name)}
      initialsBadge={initials(name)}
    />
  );
}

function SummaryGroup({
  icon,
  title,
  eyebrow,
  subtitle,
  files,
}: {
  icon: React.ReactNode;
  title: string;
  eyebrow?: string;
  subtitle: string;
  files: string[];
  initialsBadge?: string;
}) {
  return (
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]/60">
        {icon}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--color-fg-subtle)]">
              {eyebrow}
            </span>
          )}
          <div className="text-[13px] font-medium text-[var(--color-fg)] truncate">
            {title}
          </div>
        </div>
        <span className="text-[11px] text-[var(--color-fg-subtle)] tabular-nums shrink-0">
          {subtitle}
        </span>
      </div>
      {files.length > 0 ? (
        <ul className="divide-y divide-[var(--color-border)]">
          {files.map((name, idx) => (
            <li
              key={`${name}-${idx}`}
              className="px-3 py-2 text-[13px] text-[var(--color-fg-muted)] flex items-center gap-2"
            >
              <span className="text-[var(--color-fg-subtle)] tabular-nums text-[11px] w-5">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-3 text-[12px] italic text-[var(--color-fg-subtle)]">
          Aucun document.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[var(--color-fg-muted)]">{label}</dt>
      <dd className="font-medium text-[var(--color-fg)] tabular-nums">
        {value}
        {hint && (
          <span className="ml-1.5 text-[var(--color-fg-subtle)] font-normal text-[12px]">
            {hint}
          </span>
        )}
      </dd>
    </div>
  );
}
