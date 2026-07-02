"use client";

import { SoftwareQuoteForm } from "@/components/quote/SoftwareQuoteForm";

type QuoteModalProps = {
  open: boolean;
  onClose: () => void;
};

export function QuoteModal({ open, onClose }: QuoteModalProps) {
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
          <SoftwareQuoteForm className="mt-0" />
        </div>
      </div>
    </div>
  );
}
