export type ProfileScoreInput = {
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  categoryId: string | null;
  gallery: string[];
  hours: unknown;
  verified: boolean;
  featured: boolean;
};

export type ProfileChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  weight: number;
};

function hasHours(hours: unknown): boolean {
  if (!hours || typeof hours !== "object") return false;
  return Object.keys(hours as object).length > 0;
}

export function buildProfileChecklist(
  b: ProfileScoreInput,
): ProfileChecklistItem[] {
  const desc = b.description?.trim() ?? "";
  return [
    {
      id: "logo",
      label: "Logo del negocio",
      done: Boolean(b.logoUrl),
      href: "/app/perfil",
      weight: 15,
    },
    {
      id: "description",
      label: "Descripción (mín. 80 caracteres)",
      done: desc.length >= 80,
      href: "/app/perfil",
      weight: 20,
    },
    {
      id: "phone",
      label: "Teléfono",
      done: Boolean(b.phone?.trim()),
      href: "/app/perfil",
      weight: 10,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      done: Boolean(b.whatsapp?.trim()),
      href: "/app/perfil",
      weight: 15,
    },
    {
      id: "city",
      label: "Ciudad",
      done: Boolean(b.city?.trim()),
      href: "/app/perfil",
      weight: 10,
    },
    {
      id: "category",
      label: "Categoría",
      done: Boolean(b.categoryId),
      href: "/app/perfil",
      weight: 10,
    },
    {
      id: "gallery",
      label: "Al menos 1 foto en galería",
      done: b.gallery.length >= 1,
      href: "/app/perfil",
      weight: 10,
    },
    {
      id: "hours",
      label: "Horario de atención",
      done: hasHours(b.hours),
      href: "/app/perfil",
      weight: 10,
    },
  ];
}

export function profileScore(b: ProfileScoreInput): {
  score: number;
  checklist: ProfileChecklistItem[];
} {
  const checklist = buildProfileChecklist(b);
  const earned = checklist
    .filter((i) => i.done)
    .reduce((sum, i) => sum + i.weight, 0);
  return { score: Math.min(100, earned), checklist };
}
