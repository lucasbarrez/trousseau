"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  type Dossier,
  type Person,
  type PersonRole,
  type ProjectSummary,
  type StoredFile,
} from "./types";
import {
  deleteProject as dbDelete,
  duplicateProject as dbDuplicate,
  listProjects as dbList,
  loadDossier,
  renameProject as dbRename,
  saveDossier,
} from "./persistence";

function makeEmptyDossier(): Dossier {
  const now = Date.now();
  return {
    id: nanoid(10),
    title: "Dossier de candidature locative",
    applicantName: "",
    city: "",
    propertyDescription: "",
    messageToAgency: "",
    situationSummary: "",
    tenants: [],
    guarantors: [],
    commonFiles: [],
    tenantCommonFiles: [],
    guarantorCommonFiles: [],
    createdAt: now,
    updatedAt: now,
  };
}

function makeEmptyPerson(role: PersonRole): Person {
  return {
    id: nanoid(8),
    role,
    firstName: "",
    lastName: "",
    files: [],
  };
}

/** Container key for the documents step */
export type FileContainerId =
  | { kind: "common" }
  | { kind: "tenant-common" }
  | { kind: "guarantor-common" }
  | { kind: "person"; personId: string };

export function containerToString(c: FileContainerId): string {
  if (c.kind === "common") return "container:common";
  if (c.kind === "tenant-common") return "container:tenant-common";
  if (c.kind === "guarantor-common") return "container:guarantor-common";
  return `container:person:${c.personId}`;
}

export function containerFromString(s: string): FileContainerId | null {
  if (s === "container:common") return { kind: "common" };
  if (s === "container:tenant-common") return { kind: "tenant-common" };
  if (s === "container:guarantor-common") return { kind: "guarantor-common" };
  if (s.startsWith("container:person:")) {
    return { kind: "person", personId: s.slice("container:person:".length) };
  }
  return null;
}

type Store = {
  dossier: Dossier;
  currentStep: number;
  projects: ProjectSummary[];
  hydrated: boolean;
  saving: boolean;
  lastSavedAt: number | null;

  // Lifecycle
  hydrate: () => Promise<void>;

  // Project management
  newProject: () => void;
  switchProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  renameProject: (id: string, label: string) => Promise<void>;
  refreshProjectList: () => Promise<void>;
  saveNow: () => Promise<void>;

  // Navigation
  setStep: (step: number) => void;
  goNext: () => void;
  goPrev: () => void;

  // Cover
  setCover: (
    patch: Partial<
      Pick<Dossier, "title" | "applicantName" | "city" | "propertyDescription">
    >,
  ) => void;
  setPhoto: (data: ArrayBuffer, mime: string) => void;
  clearPhoto: () => void;

  // Message
  setMessage: (
    patch: Partial<Pick<Dossier, "messageToAgency" | "situationSummary">>,
  ) => void;
  setShowPersonInfo: (show: boolean) => void;

  // People
  addPerson: (role: PersonRole) => string;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  removePerson: (id: string) => void;

  // Files
  addFiles: (container: FileContainerId, files: StoredFile[]) => void;
  renameFile: (
    container: FileContainerId,
    fileId: string,
    name: string,
  ) => void;
  removeFile: (container: FileContainerId, fileId: string) => void;
  moveFile: (
    from: FileContainerId,
    to: FileContainerId,
    fromIndex: number,
    toIndex: number,
  ) => void;
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTOSAVE_DEBOUNCE = 600;

function scheduleAutosave(get: () => Store, set: (p: Partial<Store>) => void) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { dossier, refreshProjectList } = get();
    if (!isDossierEmpty(dossier)) {
      set({ saving: true });
      try {
        await saveDossier(dossier);
        set({ saving: false, lastSavedAt: Date.now() });
        await refreshProjectList();
      } catch (err) {
        console.error("Autosave failed", err);
        set({ saving: false });
      }
    }
  }, AUTOSAVE_DEBOUNCE);
}

function isDossierEmpty(d: Dossier): boolean {
  return (
    d.applicantName.trim() === "" &&
    d.city.trim() === "" &&
    d.tenants.length === 0 &&
    d.guarantors.length === 0 &&
    d.commonFiles.length === 0 &&
    d.tenantCommonFiles.length === 0 &&
    d.guarantorCommonFiles.length === 0 &&
    d.messageToAgency.trim() === "" &&
    d.situationSummary.trim() === "" &&
    !d.photoData
  );
}

function touch(d: Dossier): Dossier {
  return { ...d, updatedAt: Date.now() };
}

function getContainerFiles(
  dossier: Dossier,
  container: FileContainerId,
): StoredFile[] {
  if (container.kind === "common") return dossier.commonFiles;
  if (container.kind === "tenant-common") return dossier.tenantCommonFiles;
  if (container.kind === "guarantor-common") return dossier.guarantorCommonFiles;
  const all = [...dossier.tenants, ...dossier.guarantors];
  const p = all.find((p) => p.id === container.personId);
  return p?.files ?? [];
}

function setContainerFiles(
  dossier: Dossier,
  container: FileContainerId,
  files: StoredFile[],
): Dossier {
  if (container.kind === "common") {
    return touch({ ...dossier, commonFiles: files });
  }
  if (container.kind === "tenant-common") {
    return touch({ ...dossier, tenantCommonFiles: files });
  }
  if (container.kind === "guarantor-common") {
    return touch({ ...dossier, guarantorCommonFiles: files });
  }
  const updatePerson = (p: Person) =>
    p.id === container.personId ? { ...p, files } : p;
  return touch({
    ...dossier,
    tenants: dossier.tenants.map(updatePerson),
    guarantors: dossier.guarantors.map(updatePerson),
  });
}

export const useDossier = create<Store>((set, get) => {
  const after = (mut: (d: Dossier) => Dossier) => {
    set((s) => ({ dossier: mut(s.dossier) }));
    scheduleAutosave(get, set);
  };

  return {
    dossier: makeEmptyDossier(),
    currentStep: 0,
    projects: [],
    hydrated: false,
    saving: false,
    lastSavedAt: null,

    async hydrate() {
      if (get().hydrated) return;
      try {
        const projects = await dbList();
        if (projects.length > 0) {
          const recent = await loadDossier(projects[0].id);
          if (recent) {
            set({
              dossier: recent,
              projects,
              hydrated: true,
              lastSavedAt: recent.updatedAt,
            });
            return;
          }
        }
        set({ projects, hydrated: true });
      } catch (err) {
        console.error("Hydrate failed", err);
        set({ hydrated: true });
      }
    },

    newProject() {
      if (saveTimer) clearTimeout(saveTimer);
      set({
        dossier: makeEmptyDossier(),
        currentStep: 0,
        lastSavedAt: null,
      });
    },

    async switchProject(id) {
      if (saveTimer) clearTimeout(saveTimer);
      const { dossier } = get();
      if (!isDossierEmpty(dossier)) {
        try {
          await saveDossier(dossier);
        } catch (err) {
          console.error("Save before switch failed", err);
        }
      }
      const loaded = await loadDossier(id);
      if (loaded) {
        set({
          dossier: loaded,
          currentStep: 0,
          lastSavedAt: loaded.updatedAt,
        });
        await get().refreshProjectList();
      }
    },

    async deleteProject(id) {
      await dbDelete(id);
      const current = get().dossier;
      if (current.id === id) {
        set({ dossier: makeEmptyDossier(), currentStep: 0, lastSavedAt: null });
      }
      await get().refreshProjectList();
    },

    async duplicateProject(id) {
      const newId = await dbDuplicate(id);
      if (newId) {
        await get().refreshProjectList();
        await get().switchProject(newId);
      }
    },

    async renameProject(id, label) {
      await dbRename(id, label);
      set((s) =>
        s.dossier.id === id
          ? { dossier: { ...s.dossier, projectLabel: label } }
          : s,
      );
      await get().refreshProjectList();
    },

    async refreshProjectList() {
      try {
        const projects = await dbList();
        set({ projects });
      } catch (err) {
        console.error("List projects failed", err);
      }
    },

    async saveNow() {
      const { dossier } = get();
      if (saveTimer) clearTimeout(saveTimer);
      if (!isDossierEmpty(dossier)) {
        set({ saving: true });
        try {
          await saveDossier(dossier);
          set({ saving: false, lastSavedAt: Date.now() });
          await get().refreshProjectList();
        } catch (err) {
          console.error("Manual save failed", err);
          set({ saving: false });
        }
      }
    },

    setStep: (step) => set({ currentStep: step }),
    goNext: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 5) })),
    goPrev: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

    setCover: (patch) =>
      after((d) => ({ ...d, ...patch, updatedAt: Date.now() })),

    setPhoto: (data, mime) =>
      after((d) => ({
        ...d,
        photoData: data,
        photoMime: mime,
        updatedAt: Date.now(),
      })),

    clearPhoto: () =>
      after((d) => {
        const next = { ...d, updatedAt: Date.now() };
        delete next.photoData;
        delete next.photoMime;
        return next;
      }),

    setMessage: (patch) =>
      after((d) => ({ ...d, ...patch, updatedAt: Date.now() })),

    setShowPersonInfo: (show) =>
      after((d) => ({ ...d, showPersonInfo: show, updatedAt: Date.now() })),

    addPerson(role) {
      const person = makeEmptyPerson(role);
      after((d) => {
        const key = role === "tenant" ? "tenants" : "guarantors";
        return touch({ ...d, [key]: [...d[key], person] });
      });
      return person.id;
    },

    updatePerson: (id, patch) =>
      after((d) => {
        const map = (list: Person[]) =>
          list.map((p) => (p.id === id ? { ...p, ...patch } : p));
        return touch({
          ...d,
          tenants: map(d.tenants),
          guarantors: map(d.guarantors),
        });
      }),

    removePerson: (id) =>
      after((d) =>
        touch({
          ...d,
          tenants: d.tenants.filter((p) => p.id !== id),
          guarantors: d.guarantors.filter((p) => p.id !== id),
        }),
      ),

    addFiles: (container, files) =>
      after((d) => {
        const current = getContainerFiles(d, container);
        return setContainerFiles(d, container, [...current, ...files]);
      }),

    renameFile: (container, fileId, name) =>
      after((d) => {
        const current = getContainerFiles(d, container);
        const updated = current.map((f) =>
          f.id === fileId ? { ...f, name } : f,
        );
        return setContainerFiles(d, container, updated);
      }),

    removeFile: (container, fileId) =>
      after((d) => {
        const current = getContainerFiles(d, container);
        return setContainerFiles(
          d,
          container,
          current.filter((f) => f.id !== fileId),
        );
      }),

    moveFile: (from, to, fromIndex, toIndex) =>
      after((d) => {
        const fromFiles = [...getContainerFiles(d, from)];
        const [moved] = fromFiles.splice(fromIndex, 1);
        if (!moved) return d;

        if (containerToString(from) === containerToString(to)) {
          fromFiles.splice(toIndex, 0, moved);
          return setContainerFiles(d, from, fromFiles);
        }

        let next = setContainerFiles(d, from, fromFiles);
        const toFiles = [...getContainerFiles(next, to)];
        toFiles.splice(toIndex, 0, moved);
        next = setContainerFiles(next, to, toFiles);
        return next;
      }),
  };
});
