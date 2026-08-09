export function categoryLabel(
  category: { nameEs: string; nameEn: string },
  locale?: string | null,
) {
  return locale === "en" ? category.nameEn : category.nameEs;
}
