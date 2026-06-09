"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  FileText,
  FolderOpen,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDossier } from "@/lib/store";
import type { ProjectSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatRelative(ts: number) {
  const now = Date.now();
  const diff = (now - ts) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 2) return "hier";
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const projects = useDossier((s) => s.projects);
  const currentId = useDossier((s) => s.dossier.id);
  const newProject = useDossier((s) => s.newProject);
  const switchProject = useDossier((s) => s.switchProject);
  const saving = useDossier((s) => s.saving);
  const lastSavedAt = useDossier((s) => s.lastSavedAt);

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-[280px] shrink-0 z-50",
          "bg-[var(--color-surface)] border-r border-[var(--color-border)]",
          "flex flex-col transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 h-16 border-b border-[var(--color-border)]">
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[24px] italic font-[family-name:var(--font-serif)] text-[var(--color-fg)] tracking-tight truncate">
              trousseau<span className="text-[var(--color-accent)]">.</span>
            </span>
            <span className="text-[9px] text-[var(--color-fg-subtle)] uppercase tracking-[0.22em] mt-0.5">
              Dossier de location
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 -mr-1 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pt-3">
          <Button
            size="md"
            className="w-full"
            variant="soft"
            onClick={() => {
              newProject();
              onClose();
            }}
          >
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </Button>
        </div>

        <div className="px-4 pt-5 pb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[var(--color-fg-subtle)]">
            Mes dossiers
          </span>
          <span className="text-[11px] text-[var(--color-fg-subtle)] tabular-nums">
            {projects.length}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3 -mr-1">
          {projects.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-[var(--color-bg)] grid place-items-center mb-2">
                <FolderOpen className="w-4 h-4 text-[var(--color-fg-subtle)]" />
              </div>
              <p className="text-[12px] text-[var(--color-fg-muted)] leading-snug">
                Aucun dossier sauvegardé pour l&apos;instant.
                <br />
                Commencez à remplir un dossier — il sera automatiquement
                conservé.
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isCurrent={project.id === currentId}
                  onSelect={() => {
                    switchProject(project.id);
                    onClose();
                  }}
                />
              ))}
            </ul>
          )}
        </nav>

        <div className="px-4 py-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-fg-subtle)] flex items-center gap-2">
          <Lock className="w-3 h-3 shrink-0 text-[var(--color-accent)]" />
          <span className="flex-1">
            {saving ? (
              <span className="text-[var(--color-fg-muted)]">
                Sauvegarde…
              </span>
            ) : lastSavedAt ? (
              <span>
                <Check className="inline w-3 h-3 -mt-0.5 mr-0.5 text-[var(--color-success)]" />
                Sauvegardé · 100% local
              </span>
            ) : (
              <span>100% local — rien ne sort de cet onglet</span>
            )}
          </span>
        </div>
      </aside>
    </>
  );
}

function ProjectRow({
  project,
  isCurrent,
  onSelect,
}: {
  project: ProjectSummary;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const renameProject = useDossier((s) => s.renameProject);
  const deleteProject = useDossier((s) => s.deleteProject);
  const duplicateProject = useDossier((s) => s.duplicateProject);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.projectLabel ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const displayName =
    project.projectLabel ||
    project.applicantName ||
    project.title ||
    "Nouveau dossier";

  const commit = () => {
    const next = draft.trim();
    if (next && next !== project.projectLabel) {
      renameProject(project.id, next);
    }
    setEditing(false);
  };

  return (
    <li className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !editing && onSelect()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!editing) onSelect();
          }
        }}
        className={cn(
          "group w-full text-left px-2.5 py-2 rounded-[8px] transition-colors duration-150 flex items-center gap-2.5 cursor-pointer outline-none",
          isCurrent
            ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-active)]"
            : "hover:bg-[var(--color-bg)] text-[var(--color-fg)]",
        )}
      >
        <div
          className={cn(
            "w-7 h-7 rounded-md grid place-items-center shrink-0 transition-colors",
            isCurrent
              ? "bg-white text-[var(--color-accent-active)]"
              : "bg-[var(--color-bg)] text-[var(--color-fg-subtle)] group-hover:bg-[var(--color-surface)]",
          )}
        >
          <FileText className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                }
                if (e.key === "Escape") {
                  setDraft(project.projectLabel ?? "");
                  setEditing(false);
                }
              }}
              className="w-full text-[13px] font-medium bg-transparent border-b border-[var(--color-accent)] focus:outline-none py-0.5"
              placeholder={displayName}
            />
          ) : (
            <div className="text-[13px] font-medium truncate">
              {displayName}
            </div>
          )}
          <div
            className={cn(
              "text-[11px] truncate",
              isCurrent
                ? "text-[var(--color-accent-active)]/70"
                : "text-[var(--color-fg-subtle)]",
            )}
          >
            {project.city || "Sans ville"} · {project.totalFiles} fichier
            {project.totalFiles > 1 ? "s" : ""} · {formatRelative(project.updatedAt)}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className={cn(
            "shrink-0 p-1 rounded-md transition-opacity",
            menuOpen
              ? "opacity-100 bg-[var(--color-border)]"
              : "opacity-0 group-hover:opacity-100 hover:bg-[var(--color-border)]/60",
          )}
          aria-label="Plus d'options"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-2 top-[calc(100%-4px)] z-10 min-w-[180px] py-1 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-popover)]"
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            icon={<Pencil className="w-3.5 h-3.5" />}
            label="Renommer"
            onClick={() => {
              setMenuOpen(false);
              setDraft(project.projectLabel ?? displayName);
              setEditing(true);
            }}
          />
          <MenuItem
            icon={<Copy className="w-3.5 h-3.5" />}
            label="Dupliquer"
            onClick={() => {
              setMenuOpen(false);
              duplicateProject(project.id);
            }}
          />
          <div className="my-1 h-px bg-[var(--color-border)]" />
          <MenuItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Supprimer"
            destructive
            onClick={() => {
              setMenuOpen(false);
              if (
                confirm(
                  `Supprimer définitivement « ${displayName} » et tous ses fichiers ?`,
                )
              ) {
                deleteProject(project.id);
              }
            }}
          />
        </div>
      )}
    </li>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 transition-colors",
        destructive
          ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
          : "text-[var(--color-fg)] hover:bg-[var(--color-bg)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
