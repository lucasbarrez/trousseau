"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { FileText, Info } from "lucide-react";
import { StepHeader } from "@/components/StepHeader";
import { FileContainerCard, PersonContainerSummary } from "@/components/documents/FileContainerCard";
import { FileRow } from "@/components/documents/FileRow";
import {
  useDossier,
  type FileContainerId,
  containerFromString,
  containerToString,
} from "@/lib/store";
import type { Person, StoredFile } from "@/lib/types";

type FoundFile = {
  file: StoredFile;
  container: FileContainerId;
  index: number;
};

function findFile(
  containers: { container: FileContainerId; files: StoredFile[] }[],
  fileId: string,
): FoundFile | null {
  for (const c of containers) {
    const index = c.files.findIndex((f) => f.id === fileId);
    if (index >= 0) {
      return { file: c.files[index], container: c.container, index };
    }
  }
  return null;
}

export function DocumentsStep() {
  const dossier = useDossier((s) => s.dossier);
  const moveFile = useDossier((s) => s.moveFile);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const personLabel = (p: Person) => {
    const name = `${p.firstName} ${p.lastName}`.trim();
    return name || (p.role === "tenant" ? "Locataire" : "Garant");
  };

  const containers: {
    container: FileContainerId;
    files: StoredFile[];
    title: string;
    subtitle?: string;
    variant: "common" | "tenant" | "guarantor";
    index?: number;
    person?: Person;
  }[] = [
    {
      container: { kind: "common" },
      files: dossier.commonFiles,
      title: "Documents communs",
      subtitle: "Pièces qui ne concernent personne en particulier (lettres, formulaires d'agence…)",
      variant: "common",
    },
    ...(dossier.tenants.length > 0
      ? [
          {
            container: { kind: "tenant-common" as const },
            files: dossier.tenantCommonFiles,
            title: "Documents communs locataires",
            subtitle: "Pièces partagées par tous les locataires (bail actuel, avis d'imposition commun…)",
            variant: "tenant" as const,
          },
        ]
      : []),
    ...dossier.tenants.map((p, idx) => ({
      container: { kind: "person" as const, personId: p.id },
      files: p.files,
      title: personLabel(p),
      subtitle: PersonContainerSummary({ person: p }),
      variant: "tenant" as const,
      index: idx + 1,
      person: p,
    })),
    ...(dossier.guarantors.length > 0
      ? [
          {
            container: { kind: "guarantor-common" as const },
            files: dossier.guarantorCommonFiles,
            title: "Documents communs garants",
            subtitle: "Pièces partagées par tous les garants (engagement conjoint, avis d'imposition…)",
            variant: "guarantor" as const,
          },
        ]
      : []),
    ...dossier.guarantors.map((p, idx) => ({
      container: { kind: "person" as const, personId: p.id },
      files: p.files,
      title: personLabel(p),
      subtitle: PersonContainerSummary({ person: p }),
      variant: "guarantor" as const,
      index: idx + 1,
      person: p,
    })),
  ];

  const findContainerOf = (id: string): FileContainerId | null => {
    const fromKey = containerFromString(id);
    if (fromKey) return fromKey;
    for (const c of containers) {
      if (c.files.some((f) => f.id === id)) return c.container;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const fromC = findContainerOf(activeId);
    const toC = findContainerOf(overId);
    if (!fromC || !toC) return;
    if (containerToString(fromC) === containerToString(toC)) return;

    const fromList = containers.find(
      (c) => containerToString(c.container) === containerToString(fromC),
    );
    const toList = containers.find(
      (c) => containerToString(c.container) === containerToString(toC),
    );
    if (!fromList || !toList) return;

    const fromIdx = fromList.files.findIndex((f) => f.id === activeId);
    if (fromIdx === -1) return;

    let toIdx = toList.files.findIndex((f) => f.id === overId);
    if (toIdx === -1) toIdx = toList.files.length;

    moveFile(fromC, toC, fromIdx, toIdx);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const fromC = findContainerOf(activeId);
    const toC = findContainerOf(overId);
    if (!fromC || !toC) return;
    if (containerToString(fromC) !== containerToString(toC)) return;

    const list = containers.find(
      (c) => containerToString(c.container) === containerToString(fromC),
    );
    if (!list) return;

    const oldIdx = list.files.findIndex((f) => f.id === activeId);
    const newIdx = list.files.findIndex((f) => f.id === overId);
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

    moveFile(fromC, fromC, oldIdx, newIdx);
  };

  const activeFile = activeId
    ? findFile(
        containers.map(({ container, files }) => ({ container, files })),
        activeId,
      )
    : null;

  const totalFiles = containers.reduce((n, c) => n + c.files.length, 0);
  const totalPeople = dossier.tenants.length + dossier.guarantors.length;
  const hasNoPeople = totalPeople === 0;

  return (
    <div className="step-in">
      <StepHeader
        eyebrow="Étape 5 sur 6"
        icon={<FileText className="w-5 h-5" />}
        title="Documents par personne"
        description="Déposez les pièces justificatives directement dans la zone de la personne concernée. Renommez chaque fichier pour qu'il apparaisse clairement au sommaire (un double-clic suffit). Vous pouvez glisser un document d'une personne à une autre."
      />

      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--color-fg-muted)] mb-5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-active)] font-medium">
          {totalFiles} fichier{totalFiles > 1 ? "s" : ""} au total
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)]">
          {totalPeople} personne{totalPeople > 1 ? "s" : ""}
        </span>
        <span className="text-[12px] text-[var(--color-fg-subtle)] ml-auto hidden sm:inline">
          Astuce : double-clic pour renommer un fichier.
        </span>
      </div>

      {hasNoPeople && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-[12px] bg-[var(--color-warning-soft)] border border-[color-mix(in_oklab,var(--color-warning)_24%,transparent)]">
          <Info className="w-4 h-4 text-[var(--color-warning)] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[var(--color-fg)] leading-snug">
            Vous n&apos;avez pas encore ajouté de locataire ni de garant.
            Reculez de quelques étapes pour les renseigner — chacun aura sa
            propre section de documents.
          </p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {containers.map((c) => (
            <FileContainerCard
              key={containerToString(c.container)}
              container={c.container}
              title={c.title}
              subtitle={c.subtitle}
              variant={c.variant}
              index={c.index}
              files={c.files}
              person={c.person}
            />
          ))}
        </div>

        <DragOverlay>
          {activeFile && (
            <div className="rotate-1">
              <FileRow
                file={activeFile.file}
                container={activeFile.container}
                isDragging
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
