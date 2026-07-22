import type { Plan } from "@prisma/client";

export type PlanLimits = {
  leadsPerMonth: number | null; // null = ilimitado
  galleryPhotos: number;
  maxUsers: number;
  csvImport: boolean;
  verifiedEligible: boolean;
  featured: boolean;
  analytics: boolean;
  /** Google Calendar + citas CRM */
  googleCalendar: boolean;
  /** Ruta del día / optimizar paradas */
  dayRoutes: boolean;
  /** Sync listing → Google Business Profile */
  googleBusinessProfile: boolean;
  /** Booking público desde ficha */
  publicBooking: boolean;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    leadsPerMonth: 20,
    galleryPhotos: 1,
    maxUsers: 1,
    csvImport: false,
    verifiedEligible: false,
    featured: false,
    analytics: false,
    googleCalendar: false,
    dayRoutes: false,
    googleBusinessProfile: false,
    publicBooking: false,
  },
  PRO: {
    leadsPerMonth: null,
    galleryPhotos: 10,
    maxUsers: 3,
    csvImport: true,
    verifiedEligible: true,
    featured: false,
    analytics: false,
    googleCalendar: true,
    dayRoutes: false,
    googleBusinessProfile: false,
    publicBooking: false,
  },
  PREMIUM: {
    leadsPerMonth: null,
    galleryPhotos: 10,
    maxUsers: 10,
    csvImport: true,
    verifiedEligible: true,
    featured: true,
    analytics: true,
    googleCalendar: true,
    dayRoutes: true,
    googleBusinessProfile: true,
    publicBooking: true,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export const PLAN_CATALOG = [
  {
    id: "FREE" as const,
    name: "Free",
    priceLabel: "$0",
    priceCents: 0,
    description: "Empieza gratis en el directorio",
    features: [
      "Perfil básico en el directorio",
      "1 foto de galería",
      "Leads por email",
      "CRM: 20 leads/mes",
      "1 usuario",
    ],
  },
  {
    id: "PRO" as const,
    name: "Pro",
    priceLabel: "$19/mes",
    priceCents: 1900,
    description: "CRM ilimitado para crecer",
    features: [
      "Todo lo de Free",
      "Galería hasta 10 fotos",
      "Badge Verificado (tras revisión)",
      "CRM ilimitado",
      "Importar CSV",
      "Hasta 3 usuarios",
      "Google Calendar (citas)",
    ],
  },
  {
    id: "PREMIUM" as const,
    name: "Premium",
    priceLabel: "$49/mes",
    priceCents: 4900,
    description: "Máxima visibilidad en Atlanta",
    features: [
      "Todo lo de Pro",
      "Badge Destacado (prioridad en búsqueda)",
      "Analytics del perfil",
      "Hasta 10 usuarios",
      "Ruta del día + Business Profile + booking",
    ],
  },
] as const;

/** Price IDs de Stripe (env). FREE no tiene price. */
export function getStripePriceId(plan: "PRO" | "PREMIUM"): string | null {
  if (plan === "PRO") return process.env.STRIPE_PRICE_PRO?.trim() || null;
  return process.env.STRIPE_PRICE_PREMIUM?.trim() || null;
}

export function planFromStripePriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return "FREE";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "PREMIUM";
  return "FREE";
}
