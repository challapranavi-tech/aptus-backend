/** Site locale — same URL; preference in cookie + localStorage. */

export const LOCALE_COOKIE = "aptus_locale";
export const LOCALE_STORAGE_KEY = "aptus_locale";

export type Locale = "en" | "ar";

export const LOCALES: readonly Locale[] = ["en", "ar"] as const;
export const DEFAULT_LOCALE: Locale = "en";

export function parseLocale(value: string | null | undefined): Locale {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "ar" || v.startsWith("ar-")) return "ar";
  if (v === "en" || v.startsWith("en-")) return "en";
  return DEFAULT_LOCALE;
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}

export function localeHtmlLang(locale: Locale): string {
  return locale === "ar" ? "ar" : "en";
}
