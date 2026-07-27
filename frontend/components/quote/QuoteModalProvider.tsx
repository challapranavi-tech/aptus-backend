"use client";

import { QuoteModal } from "@/components/quote/QuoteModal";
import {
  quoteContextFromLink,
  quoteContextFromPathname,
  shouldOpenQuoteModal,
  type QuoteModalContext,
} from "@/components/quote/quote-modal-utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<QuoteModalContext>(() =>
    quoteContextFromPathname(pathname),
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
    <>
      {children}
      <QuoteModal open={open} onClose={() => setOpen(false)} context={context} />
    </>
  );
}
