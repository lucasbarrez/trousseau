"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { Dossier, Person, ProjectSummary, StoredFile } from "./types";

// Kept as "flat-folder" intentionally: changing the IndexedDB name would
// orphan everyone's locally stored dossiers from before the Trousseau rename.
const DB_NAME = "flat-folder";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";
const STORE_BLOBS = "blobs";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB only available in browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS);
        }
      },
    });
  }
  return dbPromise;
}

function fileKey(projectId: string, fileId: string) {
  return `${projectId}:file:${fileId}`;
}

function photoKey(projectId: string) {
  return `${projectId}:photo`;
}

function stripFile(file: StoredFile): Omit<StoredFile, "data"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, ...rest } = file;
  return rest;
}

function stripPerson(person: Person): Omit<Person, "files"> & {
  files: Omit<StoredFile, "data">[];
} {
  return { ...person, files: person.files.map(stripFile) };
}

type SerializedDossier = Omit<
  Dossier,
  "photoData" | "tenants" | "guarantors" | "commonFiles" | "tenantCommonFiles" | "guarantorCommonFiles"
> & {
  tenants: ReturnType<typeof stripPerson>[];
  guarantors: ReturnType<typeof stripPerson>[];
  commonFiles: Omit<StoredFile, "data">[];
  tenantCommonFiles: Omit<StoredFile, "data">[];
  guarantorCommonFiles: Omit<StoredFile, "data">[];
};

function serialize(dossier: Dossier): SerializedDossier {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    photoData,
    tenants,
    guarantors,
    commonFiles,
    tenantCommonFiles,
    guarantorCommonFiles,
    ...rest
  } = dossier;
  return {
    ...rest,
    tenants: tenants.map(stripPerson),
    guarantors: guarantors.map(stripPerson),
    commonFiles: commonFiles.map(stripFile),
    tenantCommonFiles: (tenantCommonFiles || []).map(stripFile),
    guarantorCommonFiles: (guarantorCommonFiles || []).map(stripFile),
  };
}

function collectFiles(dossier: Dossier): StoredFile[] {
  return [
    ...dossier.commonFiles,
    ...(dossier.tenantCommonFiles || []),
    ...(dossier.guarantorCommonFiles || []),
    ...dossier.tenants.flatMap((t) => t.files),
    ...dossier.guarantors.flatMap((g) => g.files),
  ];
}

export async function saveDossier(dossier: Dossier): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([STORE_PROJECTS, STORE_BLOBS], "readwrite");
  const projects = tx.objectStore(STORE_PROJECTS);
  const blobs = tx.objectStore(STORE_BLOBS);

  await projects.put(serialize(dossier));

  if (dossier.photoData && dossier.photoMime) {
    await blobs.put(dossier.photoData, photoKey(dossier.id));
  }

  const allFiles = collectFiles(dossier);
  const expectedKeys = new Set<string>([
    ...(dossier.photoData ? [photoKey(dossier.id)] : []),
    ...allFiles.map((f) => fileKey(dossier.id, f.id)),
  ]);

  for (const file of allFiles) {
    await blobs.put(file.data, fileKey(dossier.id, file.id));
  }

  // Clean up orphaned blobs from previous saves (deleted files, removed photo)
  const allKeys = await blobs.getAllKeys();
  for (const key of allKeys) {
    const k = String(key);
    if (k.startsWith(`${dossier.id}:`) && !expectedKeys.has(k)) {
      await blobs.delete(key);
    }
  }

  await tx.done;
}

export async function loadDossier(id: string): Promise<Dossier | null> {
  const db = await getDb();
  const meta = await db.get(STORE_PROJECTS, id);
  if (!meta) return null;

  const hydrateFile = async (
    f: Omit<StoredFile, "data">,
  ): Promise<StoredFile> => {
    const data = await db.get(STORE_BLOBS, fileKey(id, f.id));
    if (!data) {
      // Orphaned file metadata — return empty buffer to avoid hard crash
      return { ...f, data: new ArrayBuffer(0) };
    }
    return { ...f, data };
  };

  const dossier: Dossier = {
    ...meta,
    photoData: meta.photoMime
      ? ((await db.get(STORE_BLOBS, photoKey(id))) as
          | ArrayBuffer
          | undefined)
      : undefined,
    commonFiles: await Promise.all((meta.commonFiles || []).map(hydrateFile)),
    tenantCommonFiles: await Promise.all(
      (meta.tenantCommonFiles || []).map(hydrateFile),
    ),
    guarantorCommonFiles: await Promise.all(
      (meta.guarantorCommonFiles || []).map(hydrateFile),
    ),
    tenants: await Promise.all(
      (meta.tenants || []).map(
        async (t: Person & { files: Omit<StoredFile, "data">[] }) => ({
          ...t,
          files: await Promise.all(t.files.map(hydrateFile)),
        }),
      ),
    ),
    guarantors: await Promise.all(
      (meta.guarantors || []).map(
        async (g: Person & { files: Omit<StoredFile, "data">[] }) => ({
          ...g,
          files: await Promise.all(g.files.map(hydrateFile)),
        }),
      ),
    ),
  };

  return dossier;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_PROJECTS);
  return all
    .map((meta: SerializedDossier) => {
      const totalFiles =
        (meta.commonFiles?.length || 0) +
        (meta.tenantCommonFiles?.length || 0) +
        (meta.guarantorCommonFiles?.length || 0) +
        (meta.tenants?.reduce((n, t) => n + t.files.length, 0) || 0) +
        (meta.guarantors?.reduce((n, g) => n + g.files.length, 0) || 0);
      return {
        id: meta.id,
        title: meta.title,
        projectLabel: meta.projectLabel,
        applicantName: meta.applicantName,
        city: meta.city,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
        totalFiles,
        totalPeople:
          (meta.tenants?.length || 0) + (meta.guarantors?.length || 0),
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([STORE_PROJECTS, STORE_BLOBS], "readwrite");
  await tx.objectStore(STORE_PROJECTS).delete(id);
  const blobs = tx.objectStore(STORE_BLOBS);
  const keys = await blobs.getAllKeys();
  for (const key of keys) {
    if (String(key).startsWith(`${id}:`)) {
      await blobs.delete(key);
    }
  }
  await tx.done;
}

export async function renameProject(
  id: string,
  projectLabel: string,
): Promise<void> {
  const db = await getDb();
  const meta = await db.get(STORE_PROJECTS, id);
  if (!meta) return;
  meta.projectLabel = projectLabel;
  meta.updatedAt = Date.now();
  await db.put(STORE_PROJECTS, meta);
}

export async function duplicateProject(id: string): Promise<string | null> {
  const src = await loadDossier(id);
  if (!src) return null;
  const { nanoid } = await import("nanoid");
  const newId = nanoid(10);
  const now = Date.now();
  const copy: Dossier = {
    ...src,
    id: newId,
    projectLabel: src.projectLabel
      ? `${src.projectLabel} (copie)`
      : undefined,
    createdAt: now,
    updatedAt: now,
  };
  await saveDossier(copy);
  return newId;
}
