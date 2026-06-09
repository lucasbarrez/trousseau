"use client";

import { useRef } from "react";
import { Camera, Home, ImagePlus, MapPin, User, X } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Field, FieldRow, HelperText } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StepHeader } from "@/components/StepHeader";
import { useDossier } from "@/lib/store";

export function CoverStep() {
  const dossier = useDossier((s) => s.dossier);
  const setCover = useDossier((s) => s.setCover);
  const setPhoto = useDossier((s) => s.setPhoto);
  const clearPhoto = useDossier((s) => s.clearPhoto);
  const fileInput = useRef<HTMLInputElement>(null);

  const photoPreviewUrl = (() => {
    if (!dossier.photoData || !dossier.photoMime) return null;
    const blob = new Blob([dossier.photoData], { type: dossier.photoMime });
    return URL.createObjectURL(blob);
  })();

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const buffer = await file.arrayBuffer();
    setPhoto(buffer, file.type);
  };

  return (
    <div className="step-in">
      <StepHeader
        eyebrow="Étape 1 sur 6"
        icon={<Home className="w-5 h-5" />}
        title="Page de garde"
        description="Ces informations apparaîtront sur la couverture de votre dossier. Soyez concis : le but est d'identifier le candidat et le bien convoité en un coup d'œil."
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 items-stretch">
        <Card>
          <CardBody className="space-y-5">
            <Field>
              <Label htmlFor="applicantName" required>
                Nom du candidat
              </Label>
              <Input
                id="applicantName"
                placeholder="Jeanne Martin"
                value={dossier.applicantName}
                onChange={(e) => setCover({ applicantName: e.target.value })}
                autoComplete="name"
              />
              <HelperText>
                Le nom complet qui figurera en grand sur la couverture.
              </HelperText>
            </Field>

            <Field>
              <Label htmlFor="title">Titre du dossier</Label>
              <Input
                id="title"
                value={dossier.title}
                onChange={(e) => setCover({ title: e.target.value })}
              />
            </Field>

            <FieldRow>
              <Field>
                <Label htmlFor="city" required>Ville</Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  value={dossier.city}
                  onChange={(e) => setCover({ city: e.target.value })}
                />
              </Field>
              <Field>
                <Label htmlFor="propertyDescription" hint="Optionnel">
                  Bien visé
                </Label>
                <Input
                  id="propertyDescription"
                  placeholder="T2 · 45 m² · 11ᵉ arrondissement"
                  value={dossier.propertyDescription}
                  onChange={(e) =>
                    setCover({ propertyDescription: e.target.value })
                  }
                />
              </Field>
            </FieldRow>
          </CardBody>
        </Card>

        <Card className="h-full">
          <CardBody className="h-full flex flex-col">
            <Label hint="Optionnel" className="mb-3">Photo de profil</Label>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />

            {photoPreviewUrl ? (
              <div className="relative group rounded-[12px] overflow-hidden border border-[var(--color-border)] flex-1 min-h-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreviewUrl}
                  alt="Aperçu de la photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInput.current?.click()}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Changer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 hover:text-white"
                    onClick={clearPhoto}
                  >
                    <X className="w-3.5 h-3.5" />
                    Retirer
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="w-full flex-1 min-h-0 rounded-[12px] border-2 border-dashed border-[var(--color-border-strong)] grid place-items-center text-center p-6 transition-colors duration-200 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/30 group"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] grid place-items-center group-hover:bg-[var(--color-accent-soft)] transition-colors">
                    <ImagePlus className="w-4 h-4 text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)]" />
                  </div>
                  <span className="text-[13px] font-medium text-[var(--color-fg)]">
                    Ajouter une photo
                  </span>
                  <span className="text-[12px] text-[var(--color-fg-subtle)]">
                    JPG, PNG · max ~5 Mo
                  </span>
                </div>
              </button>
            )}
          </CardBody>
        </Card>
      </div>

      <CoverPreviewHint
        applicantName={dossier.applicantName}
        city={dossier.city}
        propertyDescription={dossier.propertyDescription}
      />
    </div>
  );
}

function CoverPreviewHint({
  applicantName,
  city,
  propertyDescription,
}: {
  applicantName: string;
  city: string;
  propertyDescription: string;
}) {
  const ready = applicantName.trim() && city.trim();
  if (!ready) return null;
  return (
    <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[var(--color-accent-soft)] border border-[color-mix(in_oklab,var(--color-accent)_20%,transparent)]">
      <div className="w-8 h-8 rounded-full bg-white grid place-items-center text-[var(--color-accent-active)] font-[family-name:var(--font-display)] text-[13px]">
        <User className="w-4 h-4" />
      </div>
      <div className="text-[13px] text-[var(--color-accent-active)] leading-snug">
        Aperçu&nbsp;:{" "}
        <span className="font-medium">{applicantName || "—"}</span>
        <span className="opacity-60"> · </span>
        <MapPin className="inline w-3 h-3 mr-0.5 -mt-0.5" />
        <span>{city}</span>
        {propertyDescription && (
          <>
            <span className="opacity-60"> · </span>
            <span className="italic">{propertyDescription}</span>
          </>
        )}
      </div>
    </div>
  );
}
