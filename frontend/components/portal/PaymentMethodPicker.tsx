"use client";

import { PAYMENT_METHODS } from "@/lib/payment-methods";

/**
 * Read-only method picker: Bank Transfer is the only wired-up method today.
 * Card/Stripe/PayPal render as disabled "Coming soon" options so the layout
 * doesn't need to change again once a real gateway is added later.
 */
export function PaymentMethodPicker() {
  return (
    <div className="aptus-payment-methods" role="radiogroup" aria-label="Payment method">
      {PAYMENT_METHODS.map((method) => {
        const isAvailable = method.availability === "available";
        return (
          <label
            key={method.id}
            className={`aptus-payment-method${isAvailable ? " is-selected" : " is-disabled"}`}
          >
            <input
              type="radio"
              name="aptus-payment-method"
              value={method.id}
              checked={isAvailable}
              disabled={!isAvailable}
              readOnly
            />
            <span className="aptus-payment-method__control" />
            <span className="aptus-payment-method__content">
              <strong>
                {method.label}
                {!isAvailable ? <em> · Coming soon</em> : null}
              </strong>
              <small>{method.description}</small>
            </span>
          </label>
        );
      })}
    </div>
  );
}
