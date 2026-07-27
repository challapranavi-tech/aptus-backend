"use client";

import { SoftwareQuoteForm } from "@/components/quote/SoftwareQuoteForm";
import type { QuoteModalContext } from "@/components/quote/quote-modal-utils";

type QuoteModalProps = {
  open: boolean;
  onClose: () => void;
  context: QuoteModalContext;
};

export function QuoteModal({ open, onClose, context }: QuoteModalProps) {
  if (!open) return null;

  return (
    <div className="aptus-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="aptus-modal aptus-quote-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-modal-title"
      >
        <div className="aptus-quote-modal__header">
          <button type="button" className="aptus-quote-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <h2 id="quote-modal-title" className="aptus-software-form-heading">
            Request a Quote
          </h2>
          <p className="aptus-software-form-lead">
            Fill out the form below and our team will get back to you shortly
          </p>
        </div>
        <div className="aptus-quote-modal__body">
          <SoftwareQuoteForm
            key={`${context.family}:${context.defaultProduct ?? ""}`}
            className="mt-0"
            category={context.category}
            productLabel={context.productLabel}
            products={context.products}
            defaultProduct={context.defaultProduct}
          />
        </div>
      </div>
    </div>
  );
}
