import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["es", "en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "es";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  const locale: AppLocale = isLocale(raw) ? raw : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
