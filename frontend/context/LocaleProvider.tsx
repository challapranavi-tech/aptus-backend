"use client";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  localeDir,
  localeHtmlLang,
  parseLocale,
  type Locale,
} from "@/lib/locale";
import { getMessages, type MessageTree } from "@/locales/messages";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  messages: MessageTree;
  t: {
    topBar: MessageTree["topBar"];
    auth: MessageTree["auth"];
    common: MessageTree["common"];
    footer: MessageTree["footer"];
    emptyCms: string;
  };
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = localeHtmlLang(locale);
  document.documentElement.dir = localeDir(locale);
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored) {
        const parsed = parseLocale(stored);
        if (parsed !== locale) {
          setLocaleState(parsed);
          writeLocaleCookie(parsed);
          applyDocumentLocale(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    // Hydrate from storage once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      writeLocaleCookie(next);
      applyDocumentLocale(next);
      // Re-run RSC so CMS bodies localize with the new cookie.
      router.refresh();
    },
    [router],
  );

  const messages = useMemo(() => getMessages(locale), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      messages,
      t: {
        topBar: messages.topBar,
        auth: messages.auth,
        common: messages.common,
        footer: messages.footer,
        emptyCms: messages.emptyCms,
      },
    }),
    [locale, setLocale, messages],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
