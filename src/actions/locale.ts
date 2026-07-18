"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  LOCALE_COOKIE,
  isLocale,
  type AppLocale,
} from "@/i18n/request";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) {
    return { ok: false as const, error: "Idioma no soportado." };
  }

  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale as AppLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true as const };
}
