import type { PaymentMethodId } from "@/types/orders";

export type PaymentMethodAvailability = "available" | "coming_soon";

export type PaymentMethodDefinition = {
  id: PaymentMethodId;
  label: string;
  description: string;
  availability: PaymentMethodAvailability;
};

/**
 * Central registry of checkout payment methods. Bank Transfer is the only method
 * wired up today; the others are placeholders so a future payment gateway
 * integration only needs to flip `availability` and implement its own step
 * component — no changes to the checkout shell or stepper are required.
 */
export const PAYMENT_METHODS: PaymentMethodDefinition[] = [
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    description: "Transfer to our company account and upload your payment proof.",
    availability: "available",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Pay instantly online with a business or personal card.",
    availability: "coming_soon",
  },
  {
    id: "stripe",
    label: "Stripe Checkout",
    description: "Secure hosted checkout powered by Stripe.",
    availability: "coming_soon",
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Pay using your PayPal balance, card, or bank account.",
    availability: "coming_soon",
  },
];

export function getPaymentMethod(id: PaymentMethodId): PaymentMethodDefinition | undefined {
  return PAYMENT_METHODS.find((method) => method.id === id);
}
