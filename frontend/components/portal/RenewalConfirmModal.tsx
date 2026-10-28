"use client";

import { useEffect } from "react";

type RenewalConfirmModalProps = {
  open: boolean;
  onClose: () => void;
};

export function RenewalConfirmModal({ open, onClose }: RenewalConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("aptus-order-confirm-open");
    return () => {
      document.body.classList.remove("aptus-order-confirm-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="aptus-order-confirm-backdrop"
      data-aptus-renewal-confirm-modal="true"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="aptus-order-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aptus_renewal_confirm_title"
        tabIndex={-1}
      >
        <span className="aptus-order-confirm-modal__icon" aria-hidden="true">
          ✓
        </span>
        <h2 id="aptus_renewal_confirm_title">Renewal Request Submitted</h2>
        <p>
          Your renewal request has been submitted.
          <br />
          Your subscription will be renewed within 48 hours.
        </p>
        <button type="button" className="btn btn-aptus-primary" onClick={onClose}>
          OK
        </button>
      </section>
    </div>
  );
}
