/**
 * Geocodifica una dirección a lat/lng.
 * Usa Google Geocoding API si hay key; si no, Nominatim (OpenStreetMap, gratis).
 * Nunca lanza: si falla, devuelve null (el registro sigue sin coordenadas).
 */
export async function geocodeAddress(parts: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): Promise<{ lat: number; lng: number } | null> {
  const query = [parts.address, parts.city, parts.state ?? "GA", parts.zip, "USA"]
    .filter(Boolean)
    .join(", ");
  if (!query) return null;

  try {
    const googleKey = process.env.GOOGLE_GEOCODING_API_KEY;

    if (googleKey) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();
      const loc = data.results?.[0]?.geometry?.location;
      if (loc) return { lat: loc.lat, lng: loc.lng };
      return null;
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: { "User-Agent": "Konnect/1.0 (konnect.kmd.agency)" },
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error("Geocoding falló:", error);
    return null;
  }
}
