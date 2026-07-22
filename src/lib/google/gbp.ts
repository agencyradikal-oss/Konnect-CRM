/**
 * Google Business Profile — sync one-way listing → GBP.
 * Requiere scope business.manage y location name verificado.
 */

export type GbpPatchFields = {
  title?: string;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
};

export async function listGbpAccounts(accessToken: string) {
  const res = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    console.error("[gbp] list accounts:", await res.text());
    return [] as { name: string; accountName?: string }[];
  }
  const data = (await res.json()) as {
    accounts?: { name: string; accountName?: string }[];
  };
  return data.accounts ?? [];
}

export async function listGbpLocations(
  accessToken: string,
  accountName: string,
) {
  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    console.error("[gbp] list locations:", await res.text());
    return [] as { name: string; title?: string }[];
  }
  const data = (await res.json()) as {
    locations?: { name: string; title?: string }[];
  };
  return data.locations ?? [];
}

/** Patch parcial de location (no toca reseñas). */
export async function patchGbpLocation(
  accessToken: string,
  locationName: string,
  fields: GbpPatchFields,
) {
  const updateMask: string[] = [];
  const body: Record<string, unknown> = {};

  if (fields.title !== undefined) {
    body.title = fields.title;
    updateMask.push("title");
  }
  if (fields.phone !== undefined) {
    body.phoneNumbers = fields.phone
      ? { primaryPhone: fields.phone }
      : undefined;
    updateMask.push("phoneNumbers.primaryPhone");
  }
  if (fields.website !== undefined) {
    body.websiteUri = fields.website ?? undefined;
    updateMask.push("websiteUri");
  }
  if (fields.description !== undefined) {
    body.profile = { description: fields.description ?? "" };
    updateMask.push("profile.description");
  }

  if (updateMask.length === 0) {
    return { ok: true as const, skipped: true as const };
  }

  const url = new URL(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}`,
  );
  url.searchParams.set("updateMask", updateMask.join(","));

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[gbp] patch failed:", text);
    return { ok: false as const, error: "No se pudo sincronizar con Google Business Profile." };
  }
  return { ok: true as const, skipped: false as const };
}
