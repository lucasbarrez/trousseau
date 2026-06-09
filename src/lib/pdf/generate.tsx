"use client";

import "@/lib/buffer-polyfill";
import { pdf } from "@react-pdf/renderer";
import { PDFDocument, type PDFPage } from "pdf-lib";
import type { Dossier } from "@/lib/types";
import { buildGroups, computeLayout } from "./compute";
import { IntroDocument } from "./DossierDocument";
import {
  addInternalLink,
  drawFooter,
  drawGroupDivider,
  drawMainToc,
  drawWatermark,
  estimateMainTocPages,
  loadFonts,
  sanitizeForWinAnsi,
} from "./draw";
import type { ComputedLayout } from "./types";

const A4 = { width: 595.28, height: 841.89 };

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(
      ...(bytes.subarray(i, i + chunk) as unknown as number[]),
    );
  }
  return btoa(binary);
}

async function preparePhotoDataUrl(
  data: ArrayBuffer,
  mime: string,
): Promise<string> {
  // Always re-encode via canvas: the browser's image decoder handles every
  // JPEG/HEIC/WebP variant (EXIF, ICC, progressive, etc.), whereas react-pdf's
  // bundled JPEG parser (jay-peg) chokes on uncommon markers.
  const pngData = await imageToPng(data, mime);
  return `data:image/png;base64,${arrayBufferToBase64(pngData)}`;
}

async function renderIntro(dossier: Dossier): Promise<ArrayBuffer> {
  let photoSrc: string | undefined;
  if (dossier.photoData && dossier.photoMime) {
    try {
      photoSrc = await preparePhotoDataUrl(
        dossier.photoData,
        dossier.photoMime,
      );
    } catch (err) {
      console.warn("Photo de couverture non intégrée", err);
    }
  }

  const blob = await pdf(
    <IntroDocument dossier={dossier} photoSrc={photoSrc} />
  ).toBlob();
  return await blob.arrayBuffer();
}

async function imageToPng(
  data: ArrayBuffer,
  mime: string,
): Promise<ArrayBuffer> {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new window.Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Image non décodable"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D non disponible");
    ctx.drawImage(img, 0, 0);
    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!pngBlob) throw new Error("Conversion PNG impossible");
    return pngBlob.arrayBuffer();
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function addImagePage(
  finalDoc: PDFDocument,
  data: ArrayBuffer,
  mime: string,
): Promise<PDFPage> {
  let img;
  try {
    if (mime === "image/png") {
      img = await finalDoc.embedPng(data);
    } else if (mime === "image/jpeg") {
      img = await finalDoc.embedJpg(data);
    } else {
      const pngData = await imageToPng(data, mime);
      img = await finalDoc.embedPng(pngData);
    }
  } catch {
    const pngData = await imageToPng(data, mime);
    img = await finalDoc.embedPng(pngData);
  }

  const page = finalDoc.addPage([A4.width, A4.height]);
  const margin = 40;
  const maxW = A4.width - margin * 2;
  const maxH = A4.height - margin * 2;
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  page.drawImage(img, {
    x: (A4.width - w) / 2,
    y: (A4.height - h) / 2,
    width: w,
    height: h,
  });
  return page;
}

export type GenerateProgress = {
  stage: "computing" | "rendering" | "merging" | "saving" | "done";
  detail?: string;
  ratio: number;
};

export async function generateDossierPdf(
  dossier: Dossier,
  onProgress?: (p: GenerateProgress) => void,
): Promise<Blob> {
  const report = (p: GenerateProgress) => onProgress?.(p);

  report({ stage: "computing", ratio: 0.05, detail: "Analyse des fichiers" });

  const groups = buildGroups(dossier);

  report({ stage: "rendering", ratio: 0.15, detail: "Mise en page de l'intro" });

  // 1. Render the intro PDF (cover + presentation page)
  const introBytes = await renderIntro(dossier);
  const introDoc = await PDFDocument.load(introBytes);
  const introPages = introDoc.getPageCount();

  // 2. Estimate main TOC pages, compute initial layout
  const mainTocPages = estimateMainTocPages(groups);
  const layout: ComputedLayout = await computeLayout(
    groups,
    introPages,
    mainTocPages,
  );

  report({ stage: "merging", ratio: 0.3, detail: "Composition du sommaire" });

  // 3. Build the final document
  const finalDoc = await PDFDocument.create();
  finalDoc.setTitle(sanitizeForWinAnsi(dossier.title || "Dossier de candidature"));
  finalDoc.setAuthor(sanitizeForWinAnsi(dossier.applicantName || "Trousseau"));
  finalDoc.setCreator("Trousseau");
  finalDoc.setProducer("Trousseau");

  // 3a. Copy intro pages and add photo to cover
  const introCopied = await finalDoc.copyPages(
    introDoc,
    introDoc.getPageIndices(),
  );

  for (let i = 0; i < introCopied.length; i++) {
    finalDoc.addPage(introCopied[i]);
  }

  // 3c. Draw main TOC
  const fonts = await loadFonts(finalDoc);
  const tocPagesDrawn = drawMainToc(finalDoc, fonts, layout);

  // If the actual TOC page count differs from our estimate, recompute layout
  // and redraw. (Discard the wrongly-numbered TOC pages by rebuilding the doc.)
  if (tocPagesDrawn.length !== mainTocPages) {
    return regenerateWithCorrectLayout(
      dossier,
      groups,
      introDoc,
      introPages,
      tocPagesDrawn.length,
      report,
    );
  }

  // 3c. For each group: divider + files
  const totalFiles = groups.reduce((n, g) => n + g.files.length, 0);
  let filesDone = 0;
  const dividerLinks: typeof tocPagesDrawn = [];

  for (let gi = 0; gi < layout.groups.length; gi++) {
    const group = layout.groups[gi];
    const divider = drawGroupDivider(finalDoc, fonts, group, gi, dossier.showPersonInfo !== false);
    dividerLinks.push(divider);

    for (const f of group.files) {
      const file = f.file;
      if (file.type === "application/pdf") {
        try {
          const userPdf = await PDFDocument.load(file.data, {
            ignoreEncryption: true,
          });
          const pages = await finalDoc.copyPages(
            userPdf,
            userPdf.getPageIndices(),
          );
          pages.forEach((p) => {
            finalDoc.addPage(p);
            drawWatermark(p, fonts.helvBold);
          });
        } catch (err) {
          console.warn(`PDF illisible ignoré : ${file.fileName}`, err);
        }
      } else if (file.type.startsWith("image/")) {
        try {
          const page = await addImagePage(finalDoc, file.data, file.type);
          drawWatermark(page, fonts.helvBold);
        } catch (err) {
          console.warn(`Image non intégrée : ${file.fileName}`, err);
        }
      }
      filesDone++;
      if (totalFiles > 0) {
        const ratio = 0.3 + 0.5 * (filesDone / totalFiles);
        report({
          stage: "merging",
          ratio,
          detail: `Intégration : ${file.name}`,
        });
      }
    }
  }

  // 4. Apply link annotations now that all pages exist
  applyLinks(finalDoc, tocPagesDrawn, dividerLinks);

  // 5. Page footers (skip cover)
  const total = finalDoc.getPageCount();
  for (let i = 1; i < total; i++) {
    const page = finalDoc.getPage(i);
    drawFooter(page, fonts, i + 1, total);
  }

  report({ stage: "saving", ratio: 0.95, detail: "Finalisation" });

  const bytes = await finalDoc.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });

  report({ stage: "done", ratio: 1 });

  return blob;
}

function applyLinks(
  doc: PDFDocument,
  tocPagesDrawn: ReturnType<typeof drawMainToc>,
  dividerLinks: ReturnType<typeof drawMainToc>,
) {
  for (const { page, links } of tocPagesDrawn) {
    for (const link of links) {
      const targetPage = doc.getPage(link.pageIndex);
      addInternalLink(
        doc,
        page,
        link.rect,
        targetPage.ref,
        A4.height - 40,
      );
    }
  }
  for (const { page, links } of dividerLinks) {
    for (const link of links) {
      const targetPage = doc.getPage(link.pageIndex);
      addInternalLink(
        doc,
        page,
        link.rect,
        targetPage.ref,
        A4.height - 40,
      );
    }
  }
}

async function regenerateWithCorrectLayout(
  dossier: Dossier,
  groups: ReturnType<typeof buildGroups>,
  introDoc: PDFDocument,
  introPages: number,
  realMainTocPages: number,
  report: (p: GenerateProgress) => void,
): Promise<Blob> {
  const layout = await computeLayout(groups, introPages, realMainTocPages);

  const finalDoc = await PDFDocument.create();
  finalDoc.setTitle(sanitizeForWinAnsi(dossier.title || "Dossier de candidature"));
  finalDoc.setAuthor(sanitizeForWinAnsi(dossier.applicantName || "Trousseau"));
  finalDoc.setCreator("Trousseau");
  finalDoc.setProducer("Trousseau");

  const introCopied = await finalDoc.copyPages(
    introDoc,
    introDoc.getPageIndices(),
  );

  for (let i = 0; i < introCopied.length; i++) {
    finalDoc.addPage(introCopied[i]);
  }

  const fonts = await loadFonts(finalDoc);
  const tocPagesDrawn = drawMainToc(finalDoc, fonts, layout);

  const totalFiles = groups.reduce((n, g) => n + g.files.length, 0);
  let filesDone = 0;
  const dividerLinks: typeof tocPagesDrawn = [];

  for (let gi = 0; gi < layout.groups.length; gi++) {
    const group = layout.groups[gi];
    const divider = drawGroupDivider(finalDoc, fonts, group, gi, dossier.showPersonInfo !== false);
    dividerLinks.push(divider);

    for (const f of group.files) {
      const file = f.file;
      if (file.type === "application/pdf") {
        try {
          const userPdf = await PDFDocument.load(file.data, {
            ignoreEncryption: true,
          });
          const pages = await finalDoc.copyPages(
            userPdf,
            userPdf.getPageIndices(),
          );
          pages.forEach((p) => {
            finalDoc.addPage(p);
            drawWatermark(p, fonts.helvBold);
          });
        } catch (err) {
          console.warn(`PDF illisible ignoré : ${file.fileName}`, err);
        }
      } else if (file.type.startsWith("image/")) {
        try {
          const page = await addImagePage(finalDoc, file.data, file.type);
          drawWatermark(page, fonts.helvBold);
        } catch (err) {
          console.warn(`Image non intégrée : ${file.fileName}`, err);
        }
      }
      filesDone++;
      if (totalFiles > 0) {
        const ratio = 0.3 + 0.5 * (filesDone / totalFiles);
        report({
          stage: "merging",
          ratio,
          detail: `Intégration : ${file.name}`,
        });
      }
    }
  }

  applyLinks(finalDoc, tocPagesDrawn, dividerLinks);

  const total = finalDoc.getPageCount();
  for (let i = 1; i < total; i++) {
    const page = finalDoc.getPage(i);
    drawFooter(page, fonts, i + 1, total);
  }

  report({ stage: "saving", ratio: 0.95, detail: "Finalisation" });

  const bytes = await finalDoc.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });

  report({ stage: "done", ratio: 1 });

  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
