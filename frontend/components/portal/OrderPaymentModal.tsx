"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthProvider";
import { authFetch, getValidAccessToken, refreshAccessToken } from "@/lib/access-token";
import {
  estimateOrderPricing,
  formatOmanAmount,
} from "@/lib/order-pricing";
import { notifyPortalDataChanged } from "@/lib/portal-data-events";
import { BankTransferDetailsCard } from "./BankTransferDetailsCard";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { PaymentProofUpload } from "./PaymentProofUpload";
import type { BankTransferDetails } from "@/lib/server/bank-transfer";
import type { PortalOrder } from "@/types/orders";

const CHECKOUT_STEPS = ["Subscription", "Billing", "Payment", "Review"] as const;

type OrderPaymentModalProps = {
  order: PortalOrder | null;
  open: boolean;
  onClose: () => void;
  onPaid?: () => void;
};

function durationLabel(duration: PortalOrder["duration"]): string {
  return duration === "3year" ? "3 Years" : "1 Year";
}

export function OrderPaymentModal({ order, open, onClose, onPaid }: OrderPaymentModalProps) {
  const { user } = useAuth();
  const dialogRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [billing, setBilling] = useState({
    company: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [bankTransferReference, setBankTransferReference] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankTransferDetails | null>(null);
  const [bankDetailsLoaded, setBankDetailsLoaded] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  const pricing = order ? estimateOrderPricing(order) : null;
  const totalDue = order?.amountDue ?? pricing?.total ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setTermsAccepted(false);
      setProcessing(false);
      setError(null);
      setProofError(null);
      setSuccess(false);
      setProofFile(null);
      setUploadProgress(null);
      setSubmittedReference(null);
      setBankDetails(null);
      setBankDetailsLoaded(false);
      setBankTransferReference(null);
      return;
    }

    setBilling({
      company: user?.company ?? "",
      contact: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      address: user?.location ?? "Muscat, Oman",
    });
  }, [open, user]);

  useEffect(() => {
    if (!open || !order) return;
    let cancelled = false;
    const query = new URLSearchParams({ orderId: order.id });
    if (order.createdAt) query.set("createdAt", order.createdAt);

    authFetch(`/api/payments/bank-details?${query.toString()}`)
      .then((response) => response.json().catch(() => null))
      .then((data: { bankDetails?: BankTransferDetails; paymentReference?: string } | null) => {
        if (cancelled) return;
        setBankDetails(data?.bankDetails ?? null);
        setBankTransferReference(data?.paymentReference ?? null);
        setBankDetailsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setBankDetailsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, order]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("aptus-checkout-open");
    dialogRef.current?.focus();
    return () => {
      document.body.classList.remove("aptus-checkout-open");
    };
  }, [open, step, success]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processing) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, processing]);

  if (!open || !order || !mounted) return null;

  async function handleSubmitOrder() {
    if (!order) return;
    if (!termsAccepted) {
      setError("Please confirm that you have transferred the payment before submitting.");
      return;
    }
    if (!proofFile) {
      setProofError("Please attach your payment proof before submitting.");
      setStep(3);
      return;
    }

    setProcessing(true);
    setError(null);
    setProofError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", proofFile);
    formData.append("confirmed", "true");
    formData.append("orderSnapshot", JSON.stringify(order));

    try {
      // authFetch normally injects the bearer token; XHR needs it set by hand so
      // we can report upload progress. Retry once on 401 after refresh.
      const postProof = async (token: string | null) =>
        new Promise<{ ok: boolean; status: number; body: unknown }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `/api/orders/${encodeURIComponent(order.id)}/bank-transfer`, true);
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.withCredentials = true;
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
          };
          xhr.onerror = () => reject(new Error("Network error while uploading payment proof"));
          xhr.onabort = () => reject(new Error("Payment proof upload was cancelled"));
          xhr.ontimeout = () => reject(new Error("Payment proof upload timed out"));
          xhr.onload = () => {
            let body: unknown = {};
            try {
              body = JSON.parse(xhr.responseText || "{}");
            } catch {
              body = {};
            }
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
          };
          xhr.send(formData);
        });

      let token = await getValidAccessToken();
      let result = await postProof(token);
      if (result.status === 401) {
        token = await refreshAccessToken();
        if (token) result = await postProof(token);
      }

      if (!result.ok) {
        const message =
          (result.body as { error?: string })?.error ?? "Submission failed. Please try again.";
        setError(message);
        setProcessing(false);
        setUploadProgress(null);
        return;
      }

      setUploadProgress(100);
      setSubmittedReference(
        (result.body as { bankTransferReference?: string })?.bankTransferReference ??
          bankTransferReference,
      );
      setSuccess(true);
      notifyPortalDataChanged("orders");
      onPaid?.();
    } catch {
      setError("Upload failed. Please check your connection and try again.");
      setProcessing(false);
      setUploadProgress(null);
    }
  }

  const modal = (
    <div
      className="aptus-checkout-backdrop"
      data-aptus-order-payment-modal="true"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !processing) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="aptus-checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aptus_order_payment_title"
        tabIndex={-1}
      >
        <button
          type="button"
          className="aptus-checkout-close"
          aria-label="Close payment"
          disabled={processing}
          onClick={onClose}
        >
          ×
        </button>

        {success ? (
          <div className="aptus-checkout-panel aptus-checkout-success is-active">
            <span className="aptus-checkout-success__icon" aria-hidden="true">
              ✓
            </span>
            <h3>Thank You! Your Order Has Been Submitted</h3>
            <p>
              We&apos;ve successfully received your order and your payment proof has been uploaded.
            </p>
            <p>
              Your payment is now being reviewed by our finance team. Once verification is complete,
              we&apos;ll notify you by email and update your order status in your customer portal.
            </p>
            <div className="aptus-success-detail">
              <h4>Order Details</h4>
              <dl className="aptus-success-detail__table">
                <div>
                  <dt>Order Reference</dt>
                  <dd>{submittedReference ?? bankTransferReference ?? order.reference}</dd>
                </div>
                <div>
                  <dt>Payment Status</dt>
                  <dd>Payment Verification Pending</dd>
                </div>
                <div>
                  <dt>Payment Proof</dt>
                  <dd>✓ Successfully Uploaded</dd>
                </div>
                <div>
                  <dt>Estimated Verification Time</dt>
                  <dd>2–3 Business Days</dd>
                </div>
              </dl>
            </div>
            <button type="button" className="btn btn-aptus-primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <header className="aptus-checkout-head">
              <h2 id="aptus_order_payment_title">Complete payment for {order.reference}</h2>
              <p>
                Review your order, then transfer payment to our bank account and upload your proof
                of payment below.
              </p>
            </header>

            <div className="aptus-checkout-stepper" aria-label="Checkout progress">
              {CHECKOUT_STEPS.map((label, index) => {
                const stepNumber = index + 1;
                const stateClass =
                  stepNumber < step ? " is-complete" : stepNumber === step ? " is-active" : "";
                const marker = stepNumber < step ? "✓" : String(stepNumber);
                return (
                  <div
                    key={label}
                    className={`aptus-checkout-step${stateClass}`}
                    data-aptus-checkout-step-indicator={stepNumber}
                  >
                    <span>{marker}</span>
                    <strong>{label}</strong>
                  </div>
                );
              })}
            </div>

            {error ? (
              <div className="aptus-checkout-alert is-error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="aptus-checkout-body">
              <section
                className={`aptus-checkout-panel${step === 1 ? " is-active" : ""}`}
                hidden={step !== 1}
              >
                <div className="aptus-checkout-section-title">
                  <span>Step 1</span>
                  <h3>Review order</h3>
                </div>
                <ul className="aptus-software-order-list">
                  {order.items.map((item) => (
                    <li key={`${item.category}-${item.productName}`}>
                      <strong>{item.productName}</strong>
                      <span>
                        {item.category} · Qty {item.quantity} · {durationLabel(order.duration)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="aptus-checkout-meta-grid">
                  <div>
                    <span>Subscription duration</span>
                    <strong>{durationLabel(order.duration)}</strong>
                  </div>
                  <div>
                    <span>Products selected</span>
                    <strong>{order.items.length}</strong>
                  </div>
                </div>
              </section>

              <section
                className={`aptus-checkout-panel${step === 2 ? " is-active" : ""}`}
                hidden={step !== 2}
              >
                <div className="aptus-checkout-section-title">
                  <span>Step 2</span>
                  <h3>Billing details</h3>
                </div>
                <div className="aptus-checkout-form-grid">
                  <label>
                    <span>Company Name</span>
                    <input
                      type="text"
                      name="softwareCompany"
                      value={billing.company}
                      onChange={(event) =>
                        setBilling((current) => ({ ...current, company: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span>Billing Contact</span>
                    <input
                      type="text"
                      name="softwareBillingContact"
                      value={billing.contact}
                      onChange={(event) =>
                        setBilling((current) => ({ ...current, contact: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span>Email Address</span>
                    <input
                      type="email"
                      name="softwareBillingEmail"
                      value={billing.email}
                      onChange={(event) =>
                        setBilling((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span>Phone Number</span>
                    <input
                      type="tel"
                      name="softwareBillingPhone"
                      value={billing.phone}
                      onChange={(event) =>
                        setBilling((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span>Billing Address</span>
                    <input
                      type="text"
                      name="softwareBillingAddress"
                      value={billing.address}
                      onChange={(event) =>
                        setBilling((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </section>

              <section
                className={`aptus-checkout-panel${step === 3 ? " is-active" : ""}`}
                hidden={step !== 3}
              >
                <div className="aptus-checkout-section-title">
                  <span>Step 3</span>
                  <h3>Payment</h3>
                </div>

                <PaymentMethodPicker />

                {pricing && totalDue != null ? (
                  <div className="aptus-checkout-summary">
                    <div>
                      <span>{durationLabel(order.duration)} subscription</span>
                      <strong>{formatOmanAmount(pricing.subscriptionFee)}</strong>
                    </div>
                    <div>
                      <span>Aptus platform fee</span>
                      <strong>{formatOmanAmount(pricing.platformFee)}</strong>
                    </div>
                    <div>
                      <span>VAT (5%)</span>
                      <strong>{formatOmanAmount(pricing.vat)}</strong>
                    </div>
                    <div className="aptus-checkout-summary__total">
                      <span>Grand total</span>
                      <strong>{formatOmanAmount(totalDue)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="aptus-order-payment-modal__quote">
                    Pricing for this order is being finalized. Please contact your account manager.
                  </p>
                )}

                {bankDetails ? (
                  <BankTransferDetailsCard
                    details={bankDetails}
                    paymentReference={bankTransferReference}
                  />
                ) : bankDetailsLoaded ? (
                  <p className="aptus-proof-error" role="alert">
                    Bank transfer details are unavailable right now, so this order cannot be paid by
                    transfer yet. Please contact support and we will send you the account details.
                  </p>
                ) : (
                  <p className="aptus-order-payment-modal__quote">Loading bank account details…</p>
                )}

                <div className="aptus-checkout-section-title aptus-checkout-section-title--tight">
                  <h3>Upload payment proof</h3>
                </div>
                <PaymentProofUpload
                  file={proofFile}
                  onFileSelected={(nextFile) => {
                    setProofFile(nextFile);
                    setProofError(null);
                  }}
                  uploadProgress={uploadProgress}
                  error={proofError}
                />
              </section>

              <section
                className={`aptus-checkout-panel${step === 4 ? " is-active" : ""}`}
                hidden={step !== 4}
              >
                <div className="aptus-checkout-section-title">
                  <span>Step 4</span>
                  <h3>Review and submit</h3>
                </div>
                <ul className="aptus-software-order-list">
                  {order.items.map((item) => (
                    <li key={`${item.category}-${item.productName}`}>
                      <strong>{item.productName}</strong>
                      <span>
                        {item.category} · Qty {item.quantity} · {durationLabel(order.duration)}
                      </span>
                    </li>
                  ))}
                </ul>
                {pricing && totalDue != null ? (
                  <div className="aptus-checkout-summary">
                    <div className="aptus-checkout-summary__total">
                      <span>Grand total</span>
                      <strong>{formatOmanAmount(totalDue)}</strong>
                    </div>
                  </div>
                ) : null}
                <div className="aptus-order-ref-card">
                  <div>
                    <span>Order ID (payment reference)</span>
                    <strong>{bankTransferReference ?? "…"}</strong>
                  </div>
                </div>
                <p className="aptus-checkout-message__hint">
                  Payment proof:{" "}
                  {proofFile ? (
                    <strong>{proofFile.name}</strong>
                  ) : (
                    <span className="aptus-proof-missing">Not uploaded yet — go back to Step 3</span>
                  )}
                </p>
                <label className="aptus-checkout-terms">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                  />
                  <span>I confirm that I have transferred the payment to the above account.</span>
                </label>
                <div className="aptus-checkout-policy">
                  <strong>What happens next</strong>
                  <p>
                    We will not mark this order as paid automatically. Our finance team verifies
                    bank transfers manually, usually within 2–3 business days, then confirms your
                    order and activates your subscriptions.
                  </p>
                </div>
              </section>

            </div>

            <footer className="aptus-checkout-actions">
              <button
                type="button"
                className="btn btn-aptus-outline"
                hidden={step <= 1}
                disabled={processing}
                onClick={() => setStep((current) => Math.max(1, current - 1))}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-aptus-outline"
                disabled={processing}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-aptus-primary"
                hidden={step >= 4}
                disabled={processing || (step === 3 && (!proofFile || !bankDetails))}
                onClick={() => {
                  if (step === 3 && !proofFile) {
                    setProofError("Please attach your payment proof before continuing.");
                    return;
                  }
                  setStep((current) => Math.min(4, current + 1));
                }}
              >
                Next
              </button>
              <button
                type="button"
                className="btn btn-aptus-primary"
                hidden={step !== 4}
                disabled={processing || !termsAccepted || !proofFile || !bankDetails}
                onClick={() => void handleSubmitOrder()}
              >
                {processing ? "Submitting…" : "Submit Order"}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
