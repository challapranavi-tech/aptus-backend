"use client";

import {
  quoteContextFromLink,
  quoteContextFromPathname,
  shouldOpenQuoteModal,
  type QuoteModalContext,
} from "@/components/quote/quote-modal-utils";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Load the heavy quote form only when the modal actually opens. */
const QuoteModal = dynamic(
  () =>
    import("@/components/quote/QuoteModal").then((m) => ({
      default: m.QuoteModal,
    })),
  { ssr: false },
);

type QuoteModalApi = {
  openQuote: (context: QuoteModalContext) => void;
  closeQuote: () => void;
};

const QuoteModalApiContext = createContext<QuoteModalApi | null>(null);

/** Same Request Quote modal used on marketing pages — also available in the portal. */
export function useQuoteModal(): QuoteModalApi {
  const api = useContext(QuoteModalApiContext);
  if (!api) {
    throw new Error("useQuoteModal must be used within QuoteModalProvider");
  }
  return api;
}

export function QuoteModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<QuoteModalContext>(() =>
    quoteContextFromPathname(pathname),
  );

  const openQuote = useCallback((next: QuoteModalContext) => {
    setContext(next);
    setOpen(true);
  }, []);

  const closeQuote = useCallback(() => {
    setOpen(false);
  }, []);

  const api = useMemo(
    () => ({ openQuote, closeQuote }),
    [openQuote, closeQuote],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a");
      if (!link || !shouldOpenQuoteModal(link)) return;
      event.preventDefault();
      setContext(quoteContextFromLink(link, window.location.pathname));
      setOpen(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <QuoteModalApiContext.Provider value={api}>
      {children}
      {open ? <QuoteModal open onClose={closeQuote} context={context} /> : null}
    </QuoteModalApiContext.Provider>
  );
}
