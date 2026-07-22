/** Construye URLs de Google Maps (sin Directions API de pago al inicio). */

export function formatAddressLine(parts: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}) {
  return [parts.address, parts.city, parts.state ?? "GA", parts.zip, "USA"]
    .filter(Boolean)
    .join(", ");
}

/** Directions: origin vacío = “Mi ubicación” en la app Maps. */
export function buildDirectionsUrl(params: {
  destination: string;
  origin?: string | null;
  waypoints?: string[];
}) {
  const search = new URLSearchParams();
  search.set("api", "1");
  search.set("destination", params.destination);
  if (params.origin) search.set("origin", params.origin);
  if (params.waypoints?.length) {
    search.set("waypoints", params.waypoints.join("|"));
  }
  search.set("travelmode", "driving");
  return `https://www.google.com/maps/dir/?${search.toString()}`;
}

export function buildMultiStopMapsUrl(stops: string[]) {
  if (stops.length === 0) return null;
  if (stops.length === 1) {
    return buildDirectionsUrl({ destination: stops[0]! });
  }
  const destination = stops[stops.length - 1]!;
  const waypoints = stops.slice(0, -1);
  return buildDirectionsUrl({ destination, waypoints });
}

/**
 * Orden greedy nearest-neighbor (sin Directions Optimize API).
 * Usa lat/lng si existen; si no, mantiene orden de entrada.
 */
export function orderStopsNearestNeighbor<
  T extends { lat?: number | null; lng?: number | null },
>(
  stops: T[],
  start?: { lat: number; lng: number } | null,
): T[] {
  if (stops.length <= 1) return [...stops];
  const withCoords = stops.filter(
    (s) => typeof s.lat === "number" && typeof s.lng === "number",
  );
  if (withCoords.length < 2) return [...stops];

  const remaining = [...withCoords];
  const ordered: T[] = [];
  let current = start ?? {
    lat: remaining[0]!.lat!,
    lng: remaining[0]!.lng!,
  };

  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i]!;
      const d =
        (s.lat! - current.lat) ** 2 + (s.lng! - current.lng) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0]!;
    ordered.push(next);
    current = { lat: next.lat!, lng: next.lng! };
  }

  const rest = stops.filter((s) => !ordered.includes(s));
  return [...ordered, ...rest];
}
