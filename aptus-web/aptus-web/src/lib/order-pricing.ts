import type { PortalOrder } from "@/types/orders";

const PRODUCT_PRICES: Record<string, { price1Year: number; price3Year: number }> = {
  photoshop: { price1Year: 95, price3Year: 240 },
  illustrator: { price1Year: 90, price3Year: 225 },
  "acrobat pro": { price1Year: 75, price3Year: 190 },
  "creative cloud": { price1Year: 180, price3Year: 450 },
  "microsoft 365": { price1Year: 110, price3Year: 280 },
  "windows server": { price1Year: 320, price3Year: 820 },
  azure: { price1Year: 150, price3Year: 380 },
  visio: { price1Year: 85, price3Year: 215 },
  autocad: { price1Year: 420, price3Year: 1050 },
  revit: { price1Year: 480, price3Year: 1200 },
  maya: { price1Year: 390, price3Year: 980 },
  inventor: { price1Year: 450, price3Year: 1120 },
  "kaspersky endpoint": { price1Year: 45, price3Year: 115 },
  "symantec endpoint protection": { price1Year: 52, price3Year: 130 },
  "bitdefender gravityzone": { price1Year: 40, price3Year: 100 },
  "mcafee total protection": { price1Year: 38, price3Year: 95 },
};

export type OrderPricing = {
  subscriptionFee: number;
  platformFee: number;
  vat: number;
  total: number;
};

function lookupProductPrice(productName: string, duration: PortalOrder["duration"]): number {
  const key = productName.trim().toLowerCase();
  const prices = PRODUCT_PRICES[key];
  if (!prices) return 0;
  return duration === "3year" ? prices.price3Year : prices.price1Year;
}

export function estimateOrderPricing(order: PortalOrder): OrderPricing | null {
  let subscriptionFee = 0;
  for (const item of order.items) {
    subscriptionFee += lookupProductPrice(item.productName, order.duration) * item.quantity;
  }
  if (subscriptionFee <= 0) return null;

  const platformFee = subscriptionFee * 0.1;
  const vat = (subscriptionFee + platformFee) * 0.05;
  const total = subscriptionFee + platformFee + vat;

  return { subscriptionFee, platformFee, vat, total };
}

export function formatOmanAmount(amount: number): string {
  return `OMR ${amount.toLocaleString("en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`;
}

export function orderTotalToBaisa(total: number): number {
  return Math.max(50, Math.round(total * 1000));
}
