import { ImageResponse } from "next/og";

/** Colores marca Konnect (globals.css). */
export const KN = {
  teal: "#31c9c0",
  ink: "#0e1b1a",
  deep: "#06302d",
  cream: "#f4faf9",
} as const;

/** Isotipo KN — letra K en bloque teal sobre fondo ink. */
export function KnMark({ size }: { size: number }) {
  const r = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.52);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: KN.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: Math.round(size * 0.72),
          height: Math.round(size * 0.72),
          borderRadius: Math.round(r * 0.7),
          background: KN.teal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: KN.deep,
          fontSize,
          fontWeight: 800,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          lineHeight: 1,
        }}
      >
        K
      </div>
    </div>
  );
}

export function iconImageResponse(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: KN.ink,
        }}
      >
        <KnMark size={Math.round(size * 0.86)} />
      </div>
    ),
    { width: size, height: size },
  );
}
