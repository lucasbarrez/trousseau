"use client";

import {
  degrees,
  PDFArray,
  PDFDocument,
  PDFFont,
  PDFName,
  PDFNumber,
  PDFPage,
  PDFRef,
  rgb,
  StandardFonts,
} from "pdf-lib";
import type { Person } from "@/lib/types";
import type { ComputedGroup, ComputedLayout } from "./types";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN_X = 60;
const CONTENT_W = A4.width - MARGIN_X * 2;

const COLOR = {
  fg: rgb(28 / 255, 25 / 255, 23 / 255),
  muted: rgb(87 / 255, 83 / 255, 78 / 255),
  subtle: rgb(120 / 255, 113 / 255, 108 / 255),
  border: rgb(214 / 255, 211 / 255, 209 / 255),
  borderSoft: rgb(231 / 255, 229 / 255, 228 / 255),
  accent: rgb(15 / 255, 118 / 255, 110 / 255),
  accentDark: rgb(19 / 255, 78 / 255, 74 / 255),
  accentSoft: rgb(240 / 255, 253 / 255, 250 / 255),
};

export type Fonts = {
  helv: PDFFont;
  helvBold: PDFFont;
  helvOblique: PDFFont;
  times: PDFFont;
  timesBold: PDFFont;
  timesItalic: PDFFont;
};

export async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  return {
    helv: await doc.embedFont(StandardFonts.Helvetica),
    helvBold: await doc.embedFont(StandardFonts.HelveticaBold),
    helvOblique: await doc.embedFont(StandardFonts.HelveticaOblique),
    times: await doc.embedFont(StandardFonts.TimesRoman),
    timesBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    timesItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   Generic helpers
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Standard PDF fonts (WinAnsi) cannot encode certain characters like Narrow No-Break Space (0x202f),
 * which is often emitted by toLocaleString("fr-FR").
 */
export function sanitizeForWinAnsi(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\u202f/g, " ") // Narrow No-Break Space -> Space
    .replace(/\u00a0/g, " ") // No-Break Space -> Space
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-") // Various dashes -> Hyphen
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes -> Apostrophe
    .replace(/[\u201c\u201d]/g, '"'); // Smart double quotes -> Double quote
}

function drawText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
    characterSpacing?: number;
  },
) {
  const sanitized = sanitizeForWinAnsi(text);
  page.drawText(sanitized, {
    x: options.x,
    y: options.y,
    font: options.font,
    size: options.size,
    color: options.color ?? COLOR.fg,
    ...(options.characterSpacing ? { characterSpacing: options.characterSpacing } : {}),
  });
}

function drawRect(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ReturnType<typeof rgb>,
) {
  page.drawRectangle({ x, y, width, height, color });
}

function drawLine(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: ReturnType<typeof rgb>,
  thickness = 1,
) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    color,
    thickness,
  });
}

/**
 * Word-wrap `text` into lines that fit within `maxWidth`, given font/size.
 */
function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  const paragraphs = sanitizeForWinAnsi(text).split(/\r?\n/);
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function truncateToWidth(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string {
  const sanitized = sanitizeForWinAnsi(text);
  if (font.widthOfTextAtSize(sanitized, size) <= maxWidth) return sanitized;
  const ellipsis = "…";
  let lo = 0;
  let hi = sanitized.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    const candidate = sanitized.slice(0, mid).trimEnd() + ellipsis;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return sanitized.slice(0, lo).trimEnd() + ellipsis;
}

/**
 * Draws a security watermark on the page.
 */
export function drawWatermark(page: PDFPage, font: PDFFont) {
  const text = sanitizeForWinAnsi("DOCUMENT DESTINÉ À LA LOCATION IMMOBILIÈRE");
  const size = 22;
  const { width: pw, height: ph } = page.getSize();
  const tw = font.widthOfTextAtSize(text, size);

  // Diagonal 45 degrees
  const angle = 45;
  const rad = (angle * Math.PI) / 180;

  // We draw 3 times for better coverage regardless of page content placement
  const draw = (cx: number, cy: number) => {
    // cx/cy is the center point we want to hit
    const x = cx - (tw / 2) * Math.cos(rad);
    const y = cy - (tw / 2) * Math.sin(rad);
    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.15,
      rotate: degrees(angle),
    });
  };

  // Center
  draw(pw / 2, ph / 2);
  // Upper left quadrant
  draw(pw * 0.25, ph * 0.75);
  // Lower right quadrant
  draw(pw * 0.75, ph * 0.25);
}


/* ─────────────────────────────────────────────────────────────────────────
   Link annotations (clickable TOC)
   ───────────────────────────────────────────────────────────────────────── */

export function addInternalLink(
  doc: PDFDocument,
  sourcePage: PDFPage,
  rect: [number, number, number, number],
  targetPageRef: PDFRef,
  targetY: number,
) {
  const dest = doc.context.obj([
    targetPageRef,
    PDFName.of("XYZ"),
    PDFNumber.of(0),
    PDFNumber.of(targetY),
    PDFNumber.of(0),
  ]);

  const linkAnnot = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: rect,
    Border: doc.context.obj([0, 0, 0]),
    A: doc.context.obj({
      Type: "Action",
      S: "GoTo",
      D: dest,
    }),
  });
  const linkRef = doc.context.register(linkAnnot);

  const annots = sourcePage.node.lookup(PDFName.of("Annots")) as
    | PDFArray
    | undefined;
  if (annots && annots instanceof PDFArray) {
    annots.push(linkRef);
  } else {
    sourcePage.node.set(
      PDFName.of("Annots"),
      doc.context.obj([linkRef]),
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Page footer (page number)
   ───────────────────────────────────────────────────────────────────────── */

export function drawFooter(
  page: PDFPage,
  fonts: Fonts,
  pageNumber: number,
  totalPages: number,
) {
  const label = `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`;
  const w = fonts.helv.widthOfTextAtSize(label, 9);
  drawText(page, label, {
    x: (A4.width - w) / 2,
    y: 30,
    font: fonts.helv,
    size: 9,
    color: COLOR.subtle,
    characterSpacing: 0.5,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Main TOC page(s)
   ───────────────────────────────────────────────────────────────────────── */

const TOC_HEADER_HEIGHT = 80; // eyebrow + title + rule
const TOC_GROUP_HEADER_HEIGHT = 28;
const TOC_FILE_LINE_HEIGHT = 16;
const TOC_GROUP_SPACING = 14;

export type TocLinkEntry =
  | { kind: "group"; groupId: string; pageIndex: number; rect: [number, number, number, number] }
  | { kind: "file"; fileId: string; pageIndex: number; rect: [number, number, number, number] };

export type DrawnTocPage = {
  page: PDFPage;
  links: TocLinkEntry[];
};

/**
 * Estimate how many pages the main TOC will need given the groups list.
 * Used during the pre-layout pass so we can compute correct file page numbers.
 */
export function estimateMainTocPages(
  groups: { files: { id: string }[] }[],
): number {
  const usable = A4.height - 60 /* top */ - 60 /* bottom */ - TOC_HEADER_HEIGHT;
  let pages = 1;
  let used = 0;
  for (const g of groups) {
    const block =
      TOC_GROUP_HEADER_HEIGHT + g.files.length * TOC_FILE_LINE_HEIGHT + TOC_GROUP_SPACING;
    if (used + block > usable) {
      pages += 1;
      used = block;
    } else {
      used += block;
    }
  }
  return pages;
}

export function drawMainToc(
  doc: PDFDocument,
  fonts: Fonts,
  layout: ComputedLayout,
): DrawnTocPage[] {
  const pages: DrawnTocPage[] = [];
  let currentPage = doc.addPage([A4.width, A4.height]);
  let currentLinks: TocLinkEntry[] = [];
  let y = A4.height - 60;

  // Header
  drawText(currentPage, "NAVIGATION", {
    x: MARGIN_X,
    y,
    font: fonts.helvBold,
    size: 9,
    color: COLOR.accent,
    characterSpacing: 2.5,
  });
  y -= 14;
  drawText(currentPage, "Sommaire", {
    x: MARGIN_X,
    y: y - 24,
    font: fonts.times,
    size: 28,
    color: COLOR.fg,
  });
  y -= 24 + 12;
  drawLine(currentPage, MARGIN_X, y - 4, MARGIN_X + 60, y - 4, COLOR.accent, 2);
  y -= 28;

  const startNewPage = () => {
    pages.push({ page: currentPage, links: currentLinks });
    currentPage = doc.addPage([A4.width, A4.height]);
    currentLinks = [];
    y = A4.height - 60;
    drawText(currentPage, "SOMMAIRE (SUITE)", {
      x: MARGIN_X,
      y,
      font: fonts.helvBold,
      size: 9,
      color: COLOR.accent,
      characterSpacing: 2.5,
    });
    y -= 30;
  };

  const minY = 80;

  for (const group of layout.groups) {
    const block =
      TOC_GROUP_HEADER_HEIGHT +
      group.files.length * TOC_FILE_LINE_HEIGHT +
      TOC_GROUP_SPACING;
    if (y - block < minY) {
      startNewPage();
    }

    // Group header
    const eyebrow = group.group.eyebrow ?? "";
    if (eyebrow) {
      drawText(currentPage, eyebrow.toUpperCase(), {
        x: MARGIN_X,
        y: y - 10,
        font: fonts.helvBold,
        size: 8,
        color: COLOR.accent,
        characterSpacing: 1.6,
      });
      y -= 12;
    }

    const titleY = y - 14;
    const titleSize = 13;
    const titleMax = CONTENT_W - 60;
    const title = truncateToWidth(group.group.title, fonts.helvBold, titleSize, titleMax);
    drawText(currentPage, title, {
      x: MARGIN_X,
      y: titleY,
      font: fonts.helvBold,
      size: titleSize,
      color: COLOR.fg,
    });

    const pageLabel = `p. ${group.dividerPage}`;
    const pageLabelW = fonts.helvBold.widthOfTextAtSize(pageLabel, 12);
    drawText(currentPage, pageLabel, {
      x: A4.width - MARGIN_X - pageLabelW,
      y: titleY,
      font: fonts.helvBold,
      size: 12,
      color: COLOR.fg,
    });

    // Link rect for the group entry
    currentLinks.push({
      kind: "group",
      groupId: group.group.id,
      pageIndex: group.dividerPage - 1,
      rect: [MARGIN_X - 2, titleY - 3, A4.width - MARGIN_X + 2, titleY + titleSize + 2],
    });

    y -= 18;
    drawLine(currentPage, MARGIN_X, y, A4.width - MARGIN_X, y, COLOR.fg, 0.5);
    y -= 8;

    if (group.files.length === 0) {
      drawText(currentPage, "(Aucun document)", {
        x: MARGIN_X + 16,
        y: y - 10,
        font: fonts.helvOblique,
        size: 10,
        color: COLOR.subtle,
      });
      y -= 14;
    } else {
      for (const f of group.files) {
        const labelY = y - 11;
        const label = truncateToWidth(
          f.file.name,
          fonts.helv,
          10.5,
          CONTENT_W - 80,
        );
        drawText(currentPage, label, {
          x: MARGIN_X + 16,
          y: labelY,
          font: fonts.helv,
          size: 10.5,
          color: COLOR.muted,
        });

        const filePageLabel = `p. ${f.startPage}`;
        const fpw = fonts.helv.widthOfTextAtSize(filePageLabel, 10.5);
        drawText(currentPage, filePageLabel, {
          x: A4.width - MARGIN_X - fpw,
          y: labelY,
          font: fonts.helv,
          size: 10.5,
          color: COLOR.fg,
        });

        currentLinks.push({
          kind: "file",
          fileId: f.file.id,
          pageIndex: f.startPage - 1,
          rect: [
            MARGIN_X + 14,
            labelY - 3,
            A4.width - MARGIN_X + 2,
            labelY + 11,
          ],
        });
        y -= TOC_FILE_LINE_HEIGHT;
      }
    }

    y -= TOC_GROUP_SPACING;
  }

  pages.push({ page: currentPage, links: currentLinks });
  return pages;
}

/* ─────────────────────────────────────────────────────────────────────────
   Group divider page (with mini-TOC)
   ───────────────────────────────────────────────────────────────────────── */

export type DrawnDividerPage = {
  page: PDFPage;
  links: TocLinkEntry[];
};

export function drawGroupDivider(
  doc: PDFDocument,
  fonts: Fonts,
  group: ComputedGroup,
  groupIndex: number,
  showPersonInfo: boolean = true,
): DrawnDividerPage {
  const page = doc.addPage([A4.width, A4.height]);
  const links: TocLinkEntry[] = [];

  let y = A4.height - 80;

  // Eyebrow (e.g., "PARTIE 02" or "DOCUMENTS COMMUNS")
  const eyebrow =
    group.group.eyebrow?.toUpperCase() ??
    `Partie ${String(groupIndex + 1).padStart(2, "0")}`;
  const eyebrowW = fonts.helvBold.widthOfTextAtSize(eyebrow, 9);
  drawText(page, eyebrow, {
    x: (A4.width - eyebrowW) / 2,
    y,
    font: fonts.helvBold,
    size: 9,
    color: COLOR.accent,
    characterSpacing: 3,
  });
  y -= 10;

  // Big section number
  const numLabel = String(groupIndex + 1).padStart(2, "0");
  const numW = fonts.times.widthOfTextAtSize(numLabel, 72);
  drawText(page, numLabel, {
    x: (A4.width - numW) / 2,
    y: y - 70,
    font: fonts.times,
    size: 72,
    color: COLOR.borderSoft,
  });
  y -= 78;

  // Title (person name or "Documents communs")
  const titleSize = 32;
  const titleText = truncateToWidth(group.group.title, fonts.times, titleSize, CONTENT_W);
  const titleW = fonts.times.widthOfTextAtSize(titleText, titleSize);
  drawText(page, titleText, {
    x: (A4.width - titleW) / 2,
    y: y - 30,
    font: fonts.times,
    size: titleSize,
    color: COLOR.fg,
  });
  y -= 38;

  // Accent rule under title
  drawLine(
    page,
    A4.width / 2 - 28,
    y - 14,
    A4.width / 2 + 28,
    y - 14,
    COLOR.accent,
    2,
  );
  y -= 36;

  // If person, draw an info box with summary (only if there's something to show
  // and the user hasn't disabled person info via the generation toggle)
  if (group.group.kind === "person" && group.group.person && showPersonInfo) {
    const p = group.group.person;
    const hasDetails =
      Boolean(p.employmentStatus) ||
      Boolean(p.jobTitle) ||
      Boolean(p.employer) ||
      Boolean(p.monthlyIncome) ||
      Boolean(p.situation && p.situation.trim()) ||
      (p.role === "guarantor" && Boolean(p.relationToTenant));
    if (hasDetails) {
      y = drawPersonInfoBox(page, fonts, p, y);
    } else {
      y -= 10;
    }
  } else if (group.group.kind === "common") {
    let subLabel = "Pièces générales du dossier";
    if (group.group.id === "tenant-common") subLabel = "Pièces communes à tous les locataires";
    if (group.group.id === "guarantor-common") subLabel = "Pièces communes à tous les garants";

    drawText(page, subLabel, {
      x: MARGIN_X,
      y: y - 12,
      font: fonts.helvOblique,
      size: 11,
      color: COLOR.subtle,
    });
    y -= 26;
  }

  y -= 16;

  // Mini-TOC header
  drawText(page, "SOMMAIRE DE LA SECTION", {
    x: MARGIN_X,
    y,
    font: fonts.helvBold,
    size: 9,
    color: COLOR.accent,
    characterSpacing: 2.2,
  });
  y -= 14;
  drawLine(page, MARGIN_X, y, A4.width - MARGIN_X, y, COLOR.fg, 0.5);
  y -= 12;

  // Mini-TOC entries
  if (group.files.length === 0) {
    drawText(page, "Aucun document dans cette section.", {
      x: MARGIN_X,
      y: y - 10,
      font: fonts.helvOblique,
      size: 11,
      color: COLOR.subtle,
    });
  } else {
    for (const f of group.files) {
      const labelY = y - 12;
      const label = truncateToWidth(f.file.name, fonts.helv, 11, CONTENT_W - 60);
      drawText(page, label, {
        x: MARGIN_X,
        y: labelY,
        font: fonts.helv,
        size: 11,
        color: COLOR.muted,
      });

      const pageLabel = `p. ${f.startPage}`;
      const pw = fonts.helv.widthOfTextAtSize(pageLabel, 11);
      drawText(page, pageLabel, {
        x: A4.width - MARGIN_X - pw,
        y: labelY,
        font: fonts.helv,
        size: 11,
        color: COLOR.fg,
      });

      links.push({
        kind: "file",
        fileId: f.file.id,
        pageIndex: f.startPage - 1,
        rect: [
          MARGIN_X - 2,
          labelY - 3,
          A4.width - MARGIN_X + 2,
          labelY + 13,
        ],
      });

      y -= 18;
    }
  }

  return { page, links };
}

function drawPersonInfoBox(
  page: PDFPage,
  fonts: Fonts,
  person: Person,
  startY: number,
): number {
  const padding = 16;
  const boxX = MARGIN_X;
  const boxW = CONTENT_W;

  // Compute content lines (only those with actual content)
  const lines: {
    text: string;
    size: number;
    font: PDFFont;
    gap: number;
    color?: ReturnType<typeof rgb>;
  }[] = [];

  // Only add relation line for guarantors who specified it (the eyebrow
  // already announces "Garant 01" / "Locataire 01")
  if (person.role === "guarantor" && person.relationToTenant?.trim()) {
    lines.push({
      text: `Garant · ${person.relationToTenant.trim()}`,
      size: 9,
      font: fonts.helvBold,
      gap: 10,
      color: COLOR.accent,
    });
  }

  const employmentBits: string[] = [];
  if (person.employmentStatus) employmentBits.push(person.employmentStatus);
  if (person.jobTitle) employmentBits.push(person.jobTitle);
  if (person.employer?.trim()) employmentBits.push(`chez ${person.employer.trim()}`);
  if (employmentBits.length) {
    lines.push({
      text: employmentBits.join(" · "),
      size: 11,
      font: fonts.helv,
      gap: 6,
      color: COLOR.muted,
    });
  }

  if (person.monthlyIncome) {
    lines.push({
      text: `Revenus · ${person.monthlyIncome.toLocaleString("fr-FR")} € net / mois`,
      size: 11,
      font: fonts.helv,
      gap: 6,
      color: COLOR.muted,
    });
  }

  let wrappedSituation: string[] = [];
  if (person.situation?.trim()) {
    wrappedSituation = wrap(
      person.situation.trim(),
      fonts.timesItalic,
      10.5,
      boxW - padding * 2,
    );
  }

  // If nothing to show, skip the box entirely
  if (lines.length === 0 && wrappedSituation.length === 0) {
    return startY;
  }

  let lineHeights = lines.reduce((sum, l) => sum + l.size + l.gap, 0);
  if (wrappedSituation.length > 0) {
    lineHeights += (lines.length > 0 ? 4 : 0) + wrappedSituation.length * 14;
  }
  const boxH = padding * 2 + lineHeights;
  const boxY = startY - boxH;

  // Box background + border
  drawRect(page, boxX, boxY, boxW, boxH, COLOR.accentSoft);
  // Left accent bar
  drawRect(page, boxX, boxY, 3, boxH, COLOR.accent);
  // Top/bottom subtle border
  drawLine(page, boxX, boxY, boxX + boxW, boxY, COLOR.borderSoft, 0.5);
  drawLine(page, boxX, boxY + boxH, boxX + boxW, boxY + boxH, COLOR.borderSoft, 0.5);

  let cursorY = startY - padding - 2;
  for (const ln of lines) {
    cursorY -= ln.size;
    drawText(page, ln.text, {
      x: boxX + padding + 4,
      y: cursorY,
      font: ln.font,
      size: ln.size,
      color: ln.color ?? COLOR.fg,
    });
    cursorY -= ln.gap;
  }

  if (wrappedSituation.length > 0) {
    cursorY -= 4;
    for (const w of wrappedSituation) {
      cursorY -= 11;
      drawText(page, w, {
        x: boxX + padding + 4,
        y: cursorY,
        font: fonts.timesItalic,
        size: 10.5,
        color: COLOR.muted,
      });
      cursorY -= 3;
    }
  }

  return boxY - 14;
}
