import { ImageResponse } from "next/og";
import { KN, KnMark } from "@/lib/brand-og";

export const alt = "Konnect™ — Directorio de negocios hispanos en Atlanta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `linear-gradient(145deg, ${KN.ink} 0%, #163432 55%, ${KN.deep} 100%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <KnMark size={96} />
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              color: KN.cream,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            Konnect
            <span style={{ color: KN.teal }}>™</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 44,
              fontWeight: 600,
              color: KN.cream,
              maxWidth: 900,
              lineHeight: 1.2,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
            }}
          >
            Directorio de negocios hispanos en Atlanta
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: KN.teal,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
            }}
          >
            Encuentra · Contacta · Crece — CRM incluido
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
