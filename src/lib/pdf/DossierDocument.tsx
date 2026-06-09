"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Dossier } from "@/lib/types";
import { sanitizeForWinAnsi } from "./draw";

const COLOR = {
  fg: "#1C1917",
  muted: "#57534E",
  subtle: "#78716C",
  border: "#D6D3D1",
  borderSoft: "#E7E5E4",
  accent: "#0F766E",
  accentSoft: "#F0FDFA",
  accentDark: "#134E4A",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingLeft: 60,
    paddingRight: 60,
    fontFamily: "Helvetica",
    color: COLOR.fg,
    fontSize: 11,
    lineHeight: 1.5,
    backgroundColor: "#FFFFFF",
  },
  coverPage: {
    fontFamily: "Helvetica",
    color: COLOR.fg,
    backgroundColor: "#FFFFFF",
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 64,
  },
  coverEyebrow: {
    fontSize: 9,
    color: COLOR.accent,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  coverTitle: {
    fontFamily: "Times-Roman",
    fontSize: 44,
    color: COLOR.fg,
    marginTop: 18,
    lineHeight: 1.05,
    letterSpacing: -0.5,
  },
  coverRule: {
    width: 56,
    height: 2,
    backgroundColor: COLOR.accent,
    marginTop: 24,
    marginBottom: 36,
  },
  coverName: {
    fontFamily: "Times-Roman",
    fontSize: 28,
    color: COLOR.accentDark,
  },
  coverMeta: {
    marginTop: 10,
    fontSize: 12,
    color: COLOR.muted,
  },
  coverProperty: {
    marginTop: 4,
    fontSize: 12,
    color: COLOR.muted,
    fontStyle: "italic",
  },
  coverPhoto: {
    width: 168,
    height: 210,
    objectFit: "cover",
    marginTop: 40,
    borderRadius: 4,
  },
  coverFooter: {
    position: "absolute",
    bottom: 48,
    left: 64,
    right: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    fontSize: 9,
    color: COLOR.subtle,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionEyebrow: {
    fontSize: 9,
    color: COLOR.accent,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  pageTitle: {
    fontFamily: "Times-Roman",
    fontSize: 26,
    color: COLOR.fg,
    marginTop: 10,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLOR.borderSoft,
    marginVertical: 18,
  },
  messageBody: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.7,
    color: COLOR.fg,
  },
  summaryBlock: {
    marginTop: 8,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.65,
    color: COLOR.muted,
  },
});

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function CoverPage({ dossier, photoSrc }: { dossier: Dossier; photoSrc?: string }) {
  const title = sanitizeForWinAnsi(dossier.title || "Dossier de candidature");
  const name = sanitizeForWinAnsi(dossier.applicantName || "—");
  const city = sanitizeForWinAnsi(dossier.city || "");
  const desc = sanitizeForWinAnsi(dossier.propertyDescription || "");

  return (
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverEyebrow}>Dossier de candidature locative</Text>
      <Text style={styles.coverTitle}>{title}</Text>
      <View style={styles.coverRule} />

      <Text style={styles.coverName}>{name}</Text>
      {city ? <Text style={styles.coverMeta}>Ville : {city}</Text> : null}
      {desc ? <Text style={styles.coverProperty}>{desc}</Text> : null}

      {photoSrc ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={photoSrc} style={styles.coverPhoto} />
      ) : null}

      <View style={styles.coverFooter}>
        <Text>{dossier.applicantName?.toUpperCase() || ""}</Text>
        <Text>{formatDate(dossier.updatedAt).toUpperCase()}</Text>
      </View>
    </Page>
  );
}

function MessagePage({ dossier }: { dossier: Dossier }) {
  const message = sanitizeForWinAnsi(dossier.messageToAgency.trim());
  if (!message) return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.messageBody}>{message}</Text>
    </Page>
  );
}

function SummaryPage({ dossier }: { dossier: Dossier }) {
  const summary = sanitizeForWinAnsi(dossier.situationSummary.trim());
  if (!summary) return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>SITUATION</Text>
      <Text
        style={[
          styles.pageTitle,
          { fontSize: 18, marginTop: 6, marginBottom: 8 },
        ]}
      >
        En résumé
      </Text>
      <Text style={styles.summaryBlock}>{summary}</Text>
    </Page>
  );
}

/**
 * The intro PDF: cover + (optional) message page + (optional) summary page.
 */
export function IntroDocument({
  dossier,
  photoSrc,
}: {
  dossier: Dossier;
  photoSrc?: string;
}) {
  return (
    <Document
      author={sanitizeForWinAnsi(dossier.applicantName || "Trousseau")}
      title={sanitizeForWinAnsi(dossier.title || "Dossier de candidature")}
      creator="Trousseau"
      producer="Trousseau"
    >
      <CoverPage dossier={dossier} photoSrc={photoSrc} />
      <MessagePage dossier={dossier} />
      <SummaryPage dossier={dossier} />
    </Document>
  );
}
