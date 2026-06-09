"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileText,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDossier, type FileContainerId, containerToString } from "@/lib/store";
import { type StoredFile } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

export function FileRow({
  file,
  container,
  isDragging,
}: {
  file: StoredFile;
  container: FileContainerId;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dragging,
  } = useSortable({
    id: file.id,
    data: { type: "file", container: containerToString(container) },
  });

  const renameFile = useDossier((s) => s.renameFile);
  const removeFile = useDossier((s) => s.removeFile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(file.name);
  const [lastSyncedName, setLastSyncedName] = useState(file.name);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!editing && file.name !== lastSyncedName) {
    setLastSyncedName(file.name);
    setDraft(file.name);
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== file.name) renameFile(container, file.id, next);
    else setDraft(file.name);
    setEditing(false);
  };

  const isImage = file.type.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] transition-[box-shadow,border-color,opacity] duration-150",
        "hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)]",
        (dragging || isDragging) && "opacity-50 shadow-[var(--shadow-elevated)]",
      )}
    >
      <button
        type="button"
        className="touch-none text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] cursor-grab active:cursor-grabbing p-0.5 -ml-1"
        {...attributes}
        {...listeners}
        aria-label="Réordonner"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="w-8 h-8 shrink-0 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] grid place-items-center text-[var(--color-fg-muted)]">
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(file.name);
                setEditing(false);
              }
            }}
            className="w-full text-[14px] font-medium text-[var(--color-fg)] bg-transparent border-b border-[var(--color-accent)] focus:outline-none py-0.5"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => setEditing(true)}
            className="block w-full text-left text-[14px] font-medium text-[var(--color-fg)] truncate"
            title={file.fileName}
          >
            {file.name}
          </button>
        )}
        <div className="text-[11px] text-[var(--color-fg-subtle)] truncate">
          {file.fileName} · {formatBytes(file.size)}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Renommer"
          onClick={() => setEditing(true)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Supprimer"
          onClick={() => {
            if (confirm(`Retirer « ${file.name} » du dossier ?`)) {
              removeFile(container, file.id);
            }
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
