import type { Person, StoredFile } from "@/lib/types";

export type GroupKind = "common" | "person";

export type Group = {
  kind: GroupKind;
  /** Stable identifier used for keys / anchor refs */
  id: string;
  /** Title shown on the divider and in the main TOC */
  title: string;
  /** For person groups: their role-based eyebrow (e.g., "Locataire 01") */
  eyebrow?: string;
  /** Underlying person for richer rendering on the divider page */
  person?: Person;
  files: StoredFile[];
};

export type ComputedFile = {
  file: StoredFile;
  pageCount: number;
  /** 1-based absolute page number in the final document */
  startPage: number;
};

export type ComputedGroup = {
  group: Group;
  /** 1-based page of the divider/mini-TOC page */
  dividerPage: number;
  files: ComputedFile[];
};

export type ComputedLayout = {
  /** Total pages of the intro (cover + presentation) */
  introPages: number;
  /** Number of pages used by the main TOC */
  mainTocPages: number;
  /** Page of the first main-TOC page (1-based) */
  mainTocStartPage: number;
  groups: ComputedGroup[];
  totalPages: number;
};
