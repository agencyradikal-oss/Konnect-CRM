import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Konnect™ — Directorio de negocios hispanos en Atlanta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Rojo KMD del asset og.png (aprox.). */
const KMD_RED = "#E30613";

export default async function OpenGraphImage() {
  const ogBytes = await readFile(
    join(process.cwd(), "public", "brand", "og.png"),
  );
  const ogSrc = `data:image/png;base64,${ogBytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: KMD_RED,
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse */}
        <img
          src={ogSrc}
          width={630}
          height={630}
          style={{ objectFit: "contain" }}
          alt=""
        />
        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 56,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 800,
              color: "#ffffff",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 12px rgba(0,0,0,0.35)",
            }}
          >
            Konnect™
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#ffffff",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              opacity: 0.95,
              textShadow: "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            Directorio de negocios hispanos en Atlanta
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
