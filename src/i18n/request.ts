import { getRequestConfig } from "next-intl/server";

// Español primero; estructura lista para "en" (mercado Atlanta metro).
export const locales = ["es", "en"] as const;
export const defaultLocale = "es";

export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
