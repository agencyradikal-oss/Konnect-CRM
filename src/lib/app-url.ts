/** URL pública absoluta sin slash final. */
export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw && !/localhost|127\.0\.0\.1/i.test(raw)) {
    return raw.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, "")}`;
  }

  return "https://konnect.kmd.agency";
}
