import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Konnect™ — Directorio de negocios hispanos en Atlanta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Colores producto + iso KMD (globals / BrandMark). */
const C = {
  bg: "#f4faf9",
  bgSoft: "#e7f3f1",
  ink: "#0e1b1a",
  muted: "#3d5c58",
  teal: "#31c9c0",
  deep: "#06302d",
  markBg: "#000000",
} as const;

/**
 * Preview al compartir: fondo claro (se reconoce la app) + dragón KMD.
 */
export default async function OpenGraphImage() {
  const isoBytes = await readFile(
    join(process.cwd(), "public", "brand", "iso.png"),
  );
  const isoSrc = `data:image/png;base64,${isoBytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${C.bg} 0%, ${C.bgSoft} 55%, #d9ebe8 100%)`,
          position: "relative",
        }}
      >
        {/* Acento teal superior */}
        <div
          style={{
            display: "flex",
            height: 10,
            width: "100%",
            background: C.teal,
          }}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            padding: "56px 72px",
            gap: 56,
          }}
        >
          {/* Iso KMD: dragón en tile negro (como BrandMark) */}
          <div
            style={{
              display: "flex",
              width: 280,
              height: 280,
              borderRadius: 36,
              background: C.markBg,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxShadow: "0 18px 40px rgba(14, 27, 26, 0.18)",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse */}
            <img
              src={isoSrc}
              width={280}
              height={280}
              style={{ objectFit: "cover" }}
              alt=""
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontSize: 84,
                fontWeight: 800,
                color: C.ink,
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              Konnect
              <span style={{ color: C.teal, marginLeft: 4 }}>™</span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34,
                fontWeight: 600,
                color: C.muted,
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                lineHeight: 1.25,
                maxWidth: 640,
              }}
            >
              Directorio de negocios hispanos en Atlanta
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 24,
                color: C.deep,
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                opacity: 0.75,
              }}
            >
              konnect.kmd.agency
            </div>
          </div>
        </div>

        {/* Barra inferior marca */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 72px",
            borderTop: `1px solid rgba(49, 201, 192, 0.35)`,
            background: "rgba(255,255,255,0.55)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: C.muted,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
            }}
          >
            Encuentra · Contacta · Crece
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 600,
              color: C.deep,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
            }}
          >
            KMD Agency
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
