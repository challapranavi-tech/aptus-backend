"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthProvider";
import { authFetch } from "@/lib/access-token";
import {
  estimateOrderPricing,
  formatOmanAmount,
} from "@/lib/order-pricing";
import { notifyPortalDataChanged } from "@/lib/portal-data-events";
import type { PortalOrder } from "@/types/orders";

const CHECKOUT_STEPS = ["Subscription", "Billing", "Payment", "Review"] as const;

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit / Debit Card",
    note: "Pay securely using your business card.",
    supportsCardForm: true,
  },
  {
    id: "apple-pay",
    label: "Apple Pay",
    note: "Fast checkout on supported Apple devices.",
    supportsCardForm: false,
  },
  {
    id: "google-pay",
    label: "Google Pay",
    note: "Use a saved Google payment profile.",
    supportsCardForm: false,
  },
  {
    id: "thawani",
    label: "Thawani Pay",
    note: "Oman online payment gateway handoff.",
    supportsCardForm: false,
  },
] as const;

type OrderPaymentModalProps = {
  order: PortalOrder | null;
  open: boolean;
  onClose: () => void;
  onPaid?: () => void;
};

function durationLabel(duration: PortalOrder["duration"]): string {
  return duration === "3year" ? "3 Years" : "1 Year";
}

function normalizePaymentError(message?: string): string | null {
  if (!message) return null;
  if (message === "Payment is only available for approved requests") return null;
  return message;
}

export function OrderPaymentModal({ order, open, onClose, onPaid }: OrderPaymentModalProps) {
  const { user } = useAuth();
  const dialogRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [billing, setBilling] = useState({
    company: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
  });

  const pricing = order ? estimateOrderPricing(order) : null;
  const totalDue = order?.amountDue ?? pricing?.total ?? null;
  const selectedMethod = PAYMENT_METHODS.find((method) => method.id === paymentMethod);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setPaymentMethod("card");
      setTermsAccepted(false);
      setProcessing(false);
      setError(null);
      setSuccess(false);
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

  async function handlePay() {
    if (!order || totalDue == null) return;
    if (!termsAccepted) {
      setError("Please accept the subscription terms before submitting payment.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const checkoutResponse = await authFetch("/api/payments/checkout", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          currency: "omr",
          idempotencyKey: `order-pay-${order.id}`,
          orderSnapshot: order,
        }),
      });
      const checkoutData = (await checkoutResponse.json().catch(() => ({}))) as {
        error?: string;
        paymentIntentId?: string;
      };

      if (!checkoutResponse.ok || !checkoutData.paymentIntentId) {
        setError(
          normalizePaymentError(checkoutData.error) ??
            "Payment could not be processed. Please try again.",
        );
        setProcessing(false);
        return;
      }

      const completeResponse = await authFetch(`/api/orders/${encodeURIComponent(order.id)}/payment`, {
        method: "POST",
        body: JSON.stringify({
          paymentIntentId: checkoutData.paymentIntentId,
          amountPaid: totalDue,
          paymentMethod: selectedMethod?.label ?? "Portal payment",
          orderSnapshot: order,
        }),
      });
      const completeData = (await completeResponse.json().catch(() => ({}))) as { error?: string };

      if (!completeResponse.ok) {
        setError(
          normalizePaymentError(completeData.error) ??
            "Payment could not be recorded. Please contact support.",
        );
        setProcessing(false);
        return;
      }

      setSuccess(true);
      notifyPortalDataChanged("orders");
      onPaid?.();
    } catch {
      setError("Payment service unavailable. Please try again.");
      setProcessing(false);
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
            <span aria-hidden="true">✓</span>
            <h3>Payment completed</h3>
            <p>
              Your payment for {order.reference} has been received. Your subscriptions will be
              activated shortly.
            </p>
            <button type="button" className="btn btn-aptus-primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <header className="aptus-checkout-head">
              <span className="aptus-section__eyebrow">Secure Payment Checkout</span>
              <h2 id="aptus_order_payment_title">Complete payment for {order.reference}</h2>
              <p>
                Your request has been approved. Review your order, confirm billing details, and
                authorize payment to activate your software subscriptions.
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
                  <h3>Payment method</h3>
                </div>
                <div className="aptus-payment-methods" role="radiogroup" aria-label="Payment method">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`aptus-payment-method${paymentMethod === method.id ? " is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="aptus-payment-method"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      <span className="aptus-payment-method__control" />
                      <span className="aptus-payment-method__content">
                        <strong>{method.label}</strong>
                        <small>{method.note}</small>
                      </span>
                    </label>
                  ))}
                </div>
                {selectedMethod?.supportsCardForm ? (
                  <div className="aptus-payment-card-fields" data-aptus-card-fields="true">
                    <label>
                      <span>Card Number</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="1234 5678 9012 3456"
                      />
                    </label>
                    <div>
                      <label>
                        <span>Expiry Date</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM/YY"
                        />
                      </label>
                      <label>
                        <span>CVV</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          placeholder="123"
                        />
                      </label>
                    </div>
                  </div>
                ) : null}
              </section>

              <section
                className={`aptus-checkout-panel${step === 4 ? " is-active" : ""}`}
                hidden={step !== 4}
              >
                <div className="aptus-checkout-section-title">
                  <span>Step 4</span>
                  <h3>Review and pay</h3>
                </div>
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
                      <span>Total due today</span>
                      <strong>{formatOmanAmount(totalDue)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="aptus-order-payment-modal__quote">
                    Pricing for this order is being finalized. Please contact your account manager.
                  </p>
                )}
                <label className="aptus-checkout-terms">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                  />
                  <span>
                    I agree to the Aptus subscription terms, payment terms, and cancellation policy.
                  </span>
                </label>
                <div className="aptus-checkout-policy">
                  <strong>Payment confirmation</strong>
                  <p>
                    Payment will be processed now. Your software subscriptions will be activated after
                    payment is received.
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
                disabled={processing}
                onClick={() => setStep((current) => Math.min(4, current + 1))}
              >
                Next
              </button>
              <button
                type="button"
                className="btn btn-aptus-primary"
                hidden={step !== 4}
                disabled={processing || !termsAccepted || totalDue == null}
                onClick={() => void handlePay()}
              >
                {processing ? "Processing…" : "Confirm payment"}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
