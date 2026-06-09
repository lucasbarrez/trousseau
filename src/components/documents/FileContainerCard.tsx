"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Briefcase, FileStack, ShieldCheck, User } from "lucide-react";
import { FileRow } from "./FileRow";
import { Dropzone } from "./Dropzone";
import { type FileContainerId, containerToString } from "@/lib/store";
import type { Person, StoredFile } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

export function FileContainerCard({
  container,
  title,
  subtitle,
  variant,
  index,
  files,
  person,
}: {
  container: FileContainerId;
  title: string;
  subtitle?: string;
  variant: "common" | "tenant" | "guarantor";
  index?: number;
  files: StoredFile[];
  person?: Person;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: containerToString(container),
    data: { type: "container", container: containerToString(container) },
  });

  return (
    <article
      className={cn(
        "rounded-[14px] bg-[var(--color-surface)] border shadow-[var(--shadow-card)] transition-[border-color,box-shadow]",
        isOver
          ? "border-[var(--color-accent)] shadow-[var(--shadow-elevated)]"
          : "border-[var(--color-border)]",
      )}
    >
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        {variant === "common" ? (
          <div className="w-9 h-9 rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent-active)] grid place-items-center shrink-0">
            <FileStack className="w-4 h-4" />
          </div>
        ) : (
          <div
            className={cn(
              "w-9 h-9 rounded-full grid place-items-center shrink-0 text-[12px] font-semibold font-[family-name:var(--font-display)] tracking-wider",
              variant === "tenant"
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-active)]"
                : "bg-[#FEF3C7] text-[#92400E]",
            )}
          >
            {person ? initials(`${person.firstName} ${person.lastName}`) || (variant === "tenant" ? "L" : "G") : variant === "tenant" ? "L" : "G"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {variant !== "common" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold shrink-0 px-1.5 py-0.5 rounded",
                  variant === "tenant"
                    ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-active)]"
                    : "bg-[#FEF3C7] text-[#92400E]",
                )}
              >
                {variant === "tenant" ? (
                  <User className="w-3 h-3" />
                ) : (
                  <ShieldCheck className="w-3 h-3" />
                )}
                {variant === "tenant" ? "Locataire" : "Garant"}
                {index !== undefined ? ` ${index}` : ""}
              </span>
            )}
            <h3 className="text-[14px] font-semibold text-[var(--color-fg)] truncate">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-[12px] text-[var(--color-fg-subtle)] truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <span className="text-[12px] text-[var(--color-fg-subtle)] tabular-nums shrink-0">
          {files.length} {files.length > 1 ? "fichiers" : "fichier"}
        </span>
      </header>

      <div ref={setNodeRef} className="p-3 space-y-2">
        <SortableContext
          items={files.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {files.length === 0 ? (
            <Dropzone container={container} />
          ) : (
            <>
              {files.map((file) => (
                <FileRow key={file.id} file={file} container={container} />
              ))}
              <Dropzone container={container} compact />
            </>
          )}
        </SortableContext>
      </div>
    </article>
  );
}

export function PersonContainerSummary({ person }: { person: Person }) {
  const meta: string[] = [];
  if (person.employmentStatus) meta.push(person.employmentStatus);
  if (person.employer) meta.push(`chez ${person.employer}`);
  if (person.monthlyIncome)
    meta.push(`${person.monthlyIncome.toLocaleString("fr-FR")} €/mois`);
  return meta.join(" · ") || undefined;
}

export { Briefcase };
