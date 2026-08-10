"use client";

import { useEffect } from "react";

type CancellationConfirmModalProps = {
  open: boolean;
  productName: string;
  busy?: boolean;
  phase: "confirm" | "complete";
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function CancellationConfirmModal({
  open,
  productName,
  busy = false,
  phase,
  error = null,
  onConfirm,
  onClose,
}: CancellationConfirmModalProps) {
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
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, busy]);

  if (!open) return null;

  const isConfirm = phase === "confirm";

  return (
    <div
      className="aptus-order-confirm-backdrop"
      data-aptus-cancellation-confirm-modal="true"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="aptus-order-confirm-modal aptus-cancellation-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aptus_cancellation_confirm_title"
        tabIndex={-1}
      >
        <span
          className={`aptus-order-confirm-modal__icon ${
            isConfirm ? "aptus-cancellation-confirm-modal__icon--warn" : ""
          }`}
          aria-hidden="true"
        >
          {isConfirm ? "!" : "✓"}
        </span>
        <h2 id="aptus_cancellation_confirm_title">
          {isConfirm ? "Confirm cancellation" : "Subscription cancelled"}
        </h2>
        <p>
          {isConfirm ? (
            <>
              Are you sure you want to cancel <strong>{productName}</strong>?
              <br />
              Your subscription will be closed and the related CRM opportunity will be marked as
              lost. This action cannot be undone.
            </>
          ) : (
            <>
              Your subscription for <strong>{productName}</strong> has been closed.
              <br />
              The related CRM opportunity has been marked as lost.
            </>
          )}
        </p>
        {error ? (
          <p className="aptus-auth-alert is-error" role="alert">
            {error}
          </p>
        ) : null}
        {isConfirm ? (
          <div className="aptus-cancellation-confirm-modal__actions">
            <button
              type="button"
              className="btn btn-aptus-primary aptus-cancellation-confirm-modal__confirm"
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? "Cancelling…" : "Yes, cancel subscription"}
            </button>
            <button
              type="button"
              className="btn aptus-cancellation-confirm-modal__keep"
              disabled={busy}
              onClick={onClose}
            >
              Keep subscription
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-aptus-primary" onClick={onClose}>
            OK
          </button>
        )}
      </section>
    </div>
  );
}
