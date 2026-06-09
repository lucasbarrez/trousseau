import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const LORA_ITALIC_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/lora@5.2.7/files/lora-latin-500-italic.woff";

export default async function AppleIcon() {
  const lora = await fetch(LORA_ITALIC_URL).then((r) => r.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          fontFamily: "Lora",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 140,
          color: "#0F766E",
          letterSpacing: -4,
          lineHeight: 1,
          paddingBottom: 16,
        }}
      >
        t.
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Lora", data: lora, style: "italic", weight: 500 },
      ],
    },
  );
}
