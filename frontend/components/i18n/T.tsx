"use client";

import { useLocale } from "@/context/LocaleProvider";
import { copyForLocale } from "@/locales/shared-ar";

/** One shared Arabic string, rendered wherever this English sentence appears. */
export function T({ text }: { text?: string | null }) {
  const { locale } = useLocale();
  if (!text) return null;
  return copyForLocale(locale, text);
}
