import type { Metadata } from "next";
import { Inter, Cinzel, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trousseau — Dossier de location",
  description:
    "Composez un dossier de candidature locative impeccable en quelques minutes. 100% local, aucun fichier ne quitte votre navigateur.",
  openGraph: {
    title: "Trousseau — Dossier de location",
    description:
      "Composez votre dossier de candidature locative en quelques minutes, sans qu'aucun fichier ne quitte votre navigateur.",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trousseau — Dossier de location",
    description:
      "Composez votre dossier de candidature locative en quelques minutes, sans qu'aucun fichier ne quitte votre navigateur.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${cinzel.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
