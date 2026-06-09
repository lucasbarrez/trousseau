"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { nanoid } from "nanoid";
import { useDossier, type FileContainerId } from "@/lib/store";
import { type StoredFile } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/heic": [".heic"],
};

export function Dropzone({
  container,
  compact = false,
}: {
  container: FileContainerId;
  compact?: boolean;
}) {
  const addFiles = useDossier((s) => s.addFiles);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const stored: StoredFile[] = await Promise.all(
        acceptedFiles.map(async (file) => ({
          id: nanoid(8),
          name: file.name.replace(/\.[^.]+$/, ""),
          fileName: file.name,
          type: file.type,
          size: file.size,
          data: await file.arrayBuffer(),
        })),
      );
      addFiles(container, stored);
    },
    [container, addFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group cursor-pointer rounded-[12px] border-2 border-dashed transition-all duration-200 text-center",
        compact ? "py-3 px-4" : "py-7 px-6",
        isDragActive
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40",
      )}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          "flex items-center justify-center gap-2.5 text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent-active)] transition-colors",
        )}
      >
        <Upload className={cn(compact ? "w-3.5 h-3.5" : "w-5 h-5")} />
        <span className={cn(compact ? "text-[12px]" : "text-[13px]", "font-medium")}>
          {isDragActive
            ? "Déposez les fichiers ici…"
            : compact
              ? "Ajouter un fichier"
              : "Glissez vos fichiers ici, ou cliquez pour parcourir"}
        </span>
      </div>
      {!compact && (
        <p className="mt-1 text-[11px] text-[var(--color-fg-subtle)]">
          PDF · JPG · PNG · WebP — Plusieurs fichiers acceptés
        </p>
      )}
    </div>
  );
}
