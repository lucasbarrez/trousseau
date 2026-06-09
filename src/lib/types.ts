export type PersonRole = "tenant" | "guarantor";

export const EMPLOYMENT_STATUSES = [
  "CDI",
  "CDI (période d'essai)",
  "CDD",
  "Intérim",
  "Indépendant / Freelance",
  "Chef d'entreprise",
  "Fonctionnaire",
  "Étudiant",
  "Étudiant en alternance",
  "Retraité",
  "Sans emploi",
  "Autre",
] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export type StoredFile = {
  id: string;
  /** Editable display label — appears in the table of contents */
  name: string;
  /** Original filename, kept for reference but not displayed in the PDF */
  fileName: string;
  type: string;
  size: number;
  /** Raw bytes — lives in memory only */
  data: ArrayBuffer;
  pageCount?: number;
};

export type Person = {
  id: string;
  role: PersonRole;
  firstName: string;
  lastName: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  employmentStatus?: EmploymentStatus;
  employer?: string;
  jobTitle?: string;
  monthlyIncome?: number;
  /** For guarantors: relation to the applicant (e.g., "Père", "Mère") */
  relationToTenant?: string;
  /** Free-form situation paragraph */
  situation?: string;
  /** This person's documents (justificatifs) */
  files: StoredFile[];
};

export type Dossier = {
  /** Unique id, also used to namespace persisted files */
  id: string;
  title: string;
  /** Optional project label shown in the sidebar (defaults to applicantName + city) */
  projectLabel?: string;
  applicantName: string;
  city: string;
  propertyDescription: string;
  photoData?: ArrayBuffer;
  photoMime?: string;

  messageToAgency: string;
  situationSummary: string;

  /** When false, person dividers skip the info box (role / job / income / situation) */
  showPersonInfo?: boolean;

  tenants: Person[];
  guarantors: Person[];

  /** Files not tied to anyone (lettre de candidature jointe, formulaire d'agence…) */
  commonFiles: StoredFile[];
  /** Files shared by all tenants (avis d'imposition commun, bail en cours…) */
  tenantCommonFiles: StoredFile[];
  /** Files shared by all guarantors (engagement conjoint, avis d'imposition…) */
  guarantorCommonFiles: StoredFile[];

  createdAt: number;
  updatedAt: number;
};

export type ProjectSummary = {
  id: string;
  title: string;
  projectLabel?: string;
  applicantName: string;
  city: string;
  createdAt: number;
  updatedAt: number;
  totalFiles: number;
  totalPeople: number;
};
