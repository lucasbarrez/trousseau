"use client";

import { PDFDocument } from "pdf-lib";
import type { Dossier } from "@/lib/types";
import type {
  ComputedFile,
  ComputedGroup,
  ComputedLayout,
  Group,
} from "./types";

async function countPagesForFile(
  data: ArrayBuffer,
  mime: string,
): Promise<number> {
  if (mime === "application/pdf") {
    try {
      const doc = await PDFDocument.load(data, { ignoreEncryption: true });
      return doc.getPageCount();
    } catch {
      return 1;
    }
  }
  return 1;
}

export function buildGroups(dossier: Dossier): Group[] {
  const groups: Group[] = [];

  if (dossier.commonFiles.length > 0) {
    groups.push({
      kind: "common",
      id: "common",
      title: "Documents communs",
      eyebrow: "Documents communs",
      files: dossier.commonFiles,
    });
  }

  if (dossier.tenantCommonFiles.length > 0) {
    groups.push({
      kind: "common",
      id: "tenant-common",
      title: "Documents communs locataires",
      eyebrow: "Communs locataires",
      files: dossier.tenantCommonFiles,
    });
  }

  // Only include people who actually have at least one file: the documents
  // section is meant to host documents, so a person without any file is
  // silently omitted from the PDF.
  dossier.tenants
    .filter((p) => p.files.length > 0)
    .forEach((p, idx) => {
      const name = `${p.firstName} ${p.lastName}`.trim() || `Locataire ${idx + 1}`;
      groups.push({
        kind: "person",
        id: `tenant-${p.id}`,
        title: name,
        eyebrow: `Locataire ${String(idx + 1).padStart(2, "0")}`,
        person: p,
        files: p.files,
      });
    });

  if (dossier.guarantorCommonFiles.length > 0) {
    groups.push({
      kind: "common",
      id: "guarantor-common",
      title: "Documents communs garants",
      eyebrow: "Communs garants",
      files: dossier.guarantorCommonFiles,
    });
  }

  dossier.guarantors
    .filter((p) => p.files.length > 0)
    .forEach((p, idx) => {
      const name = `${p.firstName} ${p.lastName}`.trim() || `Garant ${idx + 1}`;
      groups.push({
        kind: "person",
        id: `guarantor-${p.id}`,
        title: name,
        eyebrow: `Garant ${String(idx + 1).padStart(2, "0")}`,
        person: p,
        files: p.files,
      });
    });

  return groups;
}

export async function computeLayout(
  groups: Group[],
  introPages: number,
  mainTocPages: number,
): Promise<ComputedLayout> {
  const mainTocStartPage = introPages + 1;
  let cursor = mainTocStartPage + mainTocPages;

  const computedGroups: ComputedGroup[] = [];
  for (const group of groups) {
    const dividerPage = cursor;
    cursor += 1;

    const files: ComputedFile[] = [];
    for (const file of group.files) {
      const pageCount = await countPagesForFile(file.data, file.type);
      files.push({ file, pageCount, startPage: cursor });
      cursor += pageCount;
    }
    computedGroups.push({ group, dividerPage, files });
  }

  return {
    introPages,
    mainTocPages,
    mainTocStartPage,
    groups: computedGroups,
    totalPages: cursor - 1,
  };
}
