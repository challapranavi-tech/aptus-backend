import type { PaymentMethodId } from "@/types/orders";
import { CircuitOpenError, createStripePaymentIntent } from "./stripe";

export type CheckoutRequest = {
  method: PaymentMethodId;
  amount: number;
  currency: string;
  idempotencyKey: string;
  userId: string;
  metadata: Record<string, string>;
};

export type CheckoutResult = {
  provider: PaymentMethodId;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
  /** Provider-specific client payload (e.g. Stripe client_secret later). */
  clientPayload?: Record<string, unknown>;
};

export class PaymentProviderUnavailableError extends Error {
  constructor(
    public readonly method: PaymentMethodId,
    message: string,
  ) {
    super(message);
    this.name = "PaymentProviderUnavailableError";
  }
}

/**
 * Server payment dispatch. Bank transfer uses its own upload route; card/stripe
 * share Stripe today; PayPal plugs in here without changing the checkout route shell.
 */
export async function startCheckout(input: CheckoutRequest): Promise<CheckoutResult> {
  switch (input.method) {
    case "bank_transfer":
      throw new PaymentProviderUnavailableError(
        input.method,
        "Bank transfer uses the dedicated upload flow, not card checkout.",
      );
    case "paypal":
      // ponytail: PayPal not wired — add createPayPalOrder here when credentials exist.
      throw new PaymentProviderUnavailableError(
        input.method,
        "PayPal checkout is not available yet.",
      );
    case "card":
    case "stripe": {
      const payment = await createStripePaymentIntent({
        amount: input.amount,
        currency: input.currency,
        idempotencyKey: input.idempotencyKey,
        userId: input.userId,
        metadata: input.metadata,
      });
      return {
        provider: input.method,
        paymentIntentId: payment.paymentIntentId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
      };
    }
    default: {
      const _exhaustive: never = input.method;
      throw new PaymentProviderUnavailableError(
        _exhaustive,
        "Unsupported payment method.",
      );
    }
  }
}

export { CircuitOpenError };
