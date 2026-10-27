"use client";

import { useLocale } from "@/context/LocaleProvider";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  function select(next: Locale) {
    if (next === locale) return;
    setLocale(next);
  }

  return (
    <div
      className={cn("aptus-lang-switch", className)}
      role="group"
      aria-label={t.common.language}
    >
      <button
        type="button"
        className={cn(
          "aptus-lang-switch__btn",
          locale === "en" && "aptus-lang-switch__btn--active",
        )}
        aria-pressed={locale === "en"}
        onClick={() => select("en")}
      >
        EN
      </button>
      <span className="aptus-lang-switch__sep" aria-hidden>
        |
      </span>
      <button
        type="button"
        className={cn(
          "aptus-lang-switch__btn",
          locale === "ar" && "aptus-lang-switch__btn--active",
        )}
        aria-pressed={locale === "ar"}
        lang="ar"
        onClick={() => select("ar")}
      >
        عربي
      </button>
    </div>
  );
}
