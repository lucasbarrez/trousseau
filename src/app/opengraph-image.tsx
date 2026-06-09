import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Trousseau — Composez votre dossier de location en quelques minutes.";

const LORA_ITALIC_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/lora@5.2.7/files/lora-latin-500-italic.woff";
const INTER_REGULAR_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.7/files/inter-latin-400-normal.woff";
const INTER_BOLD_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.7/files/inter-latin-600-normal.woff";

export default async function OpenGraphImage() {
  const [lora, inter400, inter600] = await Promise.all([
    fetch(LORA_ITALIC_URL).then((r) => r.arrayBuffer()),
    fetch(INTER_REGULAR_URL).then((r) => r.arrayBuffer()),
    fetch(INTER_BOLD_URL).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#FAFAF9",
          padding: "80px",
          fontFamily: "Inter",
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{ width: 100, height: 3, background: "#0F766E" }}
          />
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 18,
              color: "#0F766E",
              letterSpacing: 4,
            }}
          >
            DOSSIER DE CANDIDATURE LOCATIVE
          </div>
        </div>

        {/* Wordmark */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Lora",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 200,
              color: "#1C1917",
              letterSpacing: -4,
              display: "flex",
              lineHeight: 1,
            }}
          >
            <span>trousseau</span>
            <span style={{ color: "#0F766E" }}>.</span>
          </div>
          <div
            style={{
              marginTop: 36,
              fontFamily: "Inter",
              fontWeight: 400,
              fontSize: 28,
              color: "#57534E",
              textAlign: "center",
              lineHeight: 1.45,
              maxWidth: 900,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Composez votre dossier de location en quelques minutes,</span>
            <span>sans qu&apos;aucun fichier ne quitte votre navigateur.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #E7E5E4",
            paddingTop: 22,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 16,
            color: "#78716C",
            letterSpacing: 2.5,
          }}
        >
          <span>100% LOCAL · OPEN SOURCE · MIT</span>
          <span>github.com/lucasbarrez/trousseau</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Lora", data: lora, style: "italic", weight: 500 },
        { name: "Inter", data: inter400, style: "normal", weight: 400 },
        { name: "Inter", data: inter600, style: "normal", weight: 600 },
      ],
    },
  );
}
