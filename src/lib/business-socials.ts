import { z } from "zod";

export const SOCIAL_NETWORKS = [
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/tunegocio",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/tunegocio",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@tunegocio",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/tunegocio",
  },
] as const;

export type SocialNetworkKey = (typeof SOCIAL_NETWORKS)[number]["key"];

export type BusinessSocials = Partial<Record<SocialNetworkKey, string>>;

const optionalUrl = z
  .string()
  .max(300)
  .optional()
  .or(z.literal(""));

export const businessSocialsSchema = z.object({
  facebook: optionalUrl,
  instagram: optionalUrl,
  tiktok: optionalUrl,
  linkedin: optionalUrl,
});

/** Acepta URL con o sin https://; vacío → null. */
export function normalizeSocialUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withProtocol = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withProtocol);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function parseBusinessSocials(raw: unknown): BusinessSocials {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const out: BusinessSocials = {};
  for (const { key } of SOCIAL_NETWORKS) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) {
      const n = normalizeSocialUrl(v);
      if (n) out[key] = n;
    }
  }
  return out;
}

/** Normaliza objeto de formulario → Json para Prisma (null si vacío). */
export function socialsForDb(input: unknown): BusinessSocials | null {
  const parsed = businessSocialsSchema.safeParse(input);
  if (!parsed.success) return null;
  const out: BusinessSocials = {};
  for (const { key } of SOCIAL_NETWORKS) {
    const n = normalizeSocialUrl(parsed.data[key] ?? "");
    if (n) out[key] = n;
  }
  return Object.keys(out).length ? out : null;
}

export function socialsList(socials: BusinessSocials) {
  return SOCIAL_NETWORKS.filter((n) => socials[n.key]).map((n) => ({
    key: n.key,
    label: n.label,
    href: socials[n.key]!,
  }));
}

export function socialsSameAs(socials: BusinessSocials): string[] {
  return socialsList(socials).map((s) => s.href);
}
