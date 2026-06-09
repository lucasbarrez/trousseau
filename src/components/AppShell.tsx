"use client";

import { useEffect, useState } from "react";
import { Lock, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useDossier } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useDossier((s) => s.hydrate);
  const hydrated = useDossier((s) => s.hydrated);
  const saving = useDossier((s) => s.saving);
  const lastSavedAt = useDossier((s) => s.lastSavedAt);
  const projectLabel = useDossier(
    (s) =>
      s.dossier.projectLabel ||
      s.dossier.applicantName ||
      "Nouveau dossier",
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-[var(--color-surface)]/85 backdrop-blur-xl border-b border-[var(--color-border)]">
          <div className="px-4 sm:px-6 h-16 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-[var(--color-border)] hover:bg-[var(--color-bg)] -ml-1.5"
              aria-label="Ouvrir le menu des dossiers"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.18em] font-medium text-[var(--color-fg-subtle)]">
                Dossier en cours
              </div>
              <div className="text-[15px] font-[family-name:var(--font-display)] text-[var(--color-fg)] truncate">
                {projectLabel}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[12px] text-[var(--color-fg-muted)]">
              <SaveStatus saving={saving} lastSavedAt={lastSavedAt} />
              <span className="hidden md:flex items-center gap-1.5 text-[var(--color-fg-subtle)]">
                <Lock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                100% local
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {hydrated ? children : <HydrationSkeleton />}
        </main>

        <footer className="border-t border-[var(--color-border)] py-5 px-6 text-[11px] text-[var(--color-fg-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>Construit pour les candidats locataires en France.</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Aucun fichier ne quitte cet onglet.
          </span>
        </footer>
      </div>
    </div>
  );
}

function SaveStatus({
  saving,
  lastSavedAt,
}: {
  saving: boolean;
  lastSavedAt: number | null;
}) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] animate-pulse" />
        Sauvegarde…
      </span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--color-fg-subtle)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
        Sauvegardé
      </span>
    );
  }
  return null;
}

function HydrationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-[14px] shimmer bg-[var(--color-surface)] border border-[var(--color-border)]" />
      <div className="h-64 rounded-[14px] shimmer bg-[var(--color-surface)] border border-[var(--color-border)]" />
    </div>
  );
}
