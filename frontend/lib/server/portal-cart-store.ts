import { kvDel, kvGet, kvSet } from "./kv-store";

/** Customer reminder interval: every 7 days, max 2 times (days 7 and 14). */
export const CART_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
export const CART_REMINDER_MAX_COUNT = 2;
/** 2 business days ≈ 2 × 24 h. The cron runs daily so the email fires on the next run after the deadline. */
export const CART_SALES_FOLLOWUP_MS = 2 * 24 * 60 * 60 * 1000;

export type StoredPortalCartItem = {
  category: string;
  productName: string;
  quantity: number;
  duration?: "1year" | "3year";
  purchaseType?: "new" | "renew";
  packageId?: string;
  levelId?: string;
  serialNumber?: string;
};

export type StoredPortalCart = {
  duration: "1year" | "3year";
  items: StoredPortalCartItem[];
  updatedAt: string;
  nextReminderAt: string | null;
  /** How many cart reminder emails have been sent for this cart journey. */
  reminderCount?: number;
  partnerId?: number;
  /** Odoo crm.lead id for the active cart journey (one record). */
  crmLeadId?: number;
  /** Fingerprint last emailed to sales for cart-add notifications. */
  crmNotifiedFingerprint?: string;
  /**
   * ISO timestamp after which the sales-team follow-up email should fire
   * (if no purchase has been made). Set to 2 business days after cart creation.
   * Cleared once the follow-up has been sent.
   */
  salesFollowUpAt?: string | null;
  /** True once the 2-business-day sales follow-up email has been sent for this cart. */
  salesFollowUpSent?: boolean;
};

const INDEX_KEY = "portal-cart:index";

function cartKey(actorId: string): string {
  return `portal-cart:${actorId}`;
}

export function cartFingerprint(cart: Pick<StoredPortalCart, "duration" | "items">): string {
  const items = [...cart.items]
    .sort((a, b) =>
      `${a.category}:${a.productName}`.localeCompare(`${b.category}:${b.productName}`),
    )
    .map((item) => ({
      category: item.category,
      productName: item.productName,
      quantity: item.quantity,
      duration: item.duration ?? cart.duration,
      purchaseType: item.purchaseType,
      packageId: item.packageId,
      levelId: item.levelId,
      serialNumber: item.serialNumber,
    }));
  return JSON.stringify({ duration: cart.duration, items });
}

/**
 * True when the stored cart is the one this order was prepared from, so its lines
 * may be used for the purchase. Guards against paying an older order (which owns
 * its lines already) while a fresh, unrelated cart exists.
 */
export function cartBelongsToOrder(
  cart: Pick<StoredPortalCart, "items" | "crmLeadId"> | null | undefined,
  order: { leadId?: number; saleOrderId?: number },
): boolean {
  return Boolean(
    cart?.items.length && order.leadId && cart.crmLeadId === order.leadId && !order.saleOrderId,
  );
}

async function readIndex(): Promise<string[]> {
  const raw = await kvGet<string[]>(INDEX_KEY);
  return Array.isArray(raw) ? raw.filter((id) => typeof id === "string" && id.length > 0) : [];
}

async function addToIndex(actorId: string): Promise<void> {
  const index = await readIndex();
  if (!index.includes(actorId)) {
    await kvSet(INDEX_KEY, [...index, actorId]);
  }
}

async function removeFromIndex(actorId: string): Promise<void> {
  const index = await readIndex();
  const next = index.filter((id) => id !== actorId);
  if (next.length === index.length) return;
  if (next.length) await kvSet(INDEX_KEY, next);
  else await kvDel(INDEX_KEY);
}

export async function getStoredPortalCart(actorId: string): Promise<StoredPortalCart | null> {
  return kvGet<StoredPortalCart>(cartKey(actorId));
}

export async function saveStoredPortalCart(
  actorId: string,
  input: {
    duration: "1year" | "3year";
    items: StoredPortalCartItem[];
    partnerId?: number;
    crmLeadId?: number;
    crmNotifiedFingerprint?: string;
  },
): Promise<StoredPortalCart | null> {
  if (!input.items.length) {
    await clearStoredPortalCart(actorId);
    return null;
  }

  const now = new Date().toISOString();
  const existing = await getStoredPortalCart(actorId);
  const contentsChanged =
    !existing || cartFingerprint(existing) !== cartFingerprint(input);
  const nextReminderAt = contentsChanged
    ? new Date(Date.now() + CART_REMINDER_INTERVAL_MS).toISOString()
    : existing.nextReminderAt;
  // Fresh cart contents reset the reminder window (new 1-month / 2-email cycle).
  const reminderCount = contentsChanged ? 0 : (existing?.reminderCount ?? 0);

  // On first cart creation (no existing record) schedule a sales follow-up email
  // 2 business days later. Reset if the customer changes the cart contents.
  const salesFollowUpAt = !existing
    ? new Date(Date.now() + CART_SALES_FOLLOWUP_MS).toISOString()
    : contentsChanged
      ? new Date(Date.now() + CART_SALES_FOLLOWUP_MS).toISOString()
      : existing.salesFollowUpAt;
  const salesFollowUpSent = contentsChanged ? false : (existing?.salesFollowUpSent ?? false);

  const cart: StoredPortalCart = {
    duration: input.duration,
    items: input.items,
    updatedAt: now,
    nextReminderAt,
    reminderCount,
    partnerId: input.partnerId ?? existing?.partnerId,
    crmLeadId: input.crmLeadId ?? existing?.crmLeadId,
    crmNotifiedFingerprint:
      input.crmNotifiedFingerprint ?? existing?.crmNotifiedFingerprint,
    salesFollowUpAt,
    salesFollowUpSent,
  };

  await kvSet(cartKey(actorId), cart);
  await addToIndex(actorId);
  return cart;
}

export async function patchStoredPortalCartMeta(
  actorId: string,
  patch: Partial<Pick<StoredPortalCart, "crmLeadId" | "crmNotifiedFingerprint" | "partnerId">>,
): Promise<StoredPortalCart | null> {
  const cart = await getStoredPortalCart(actorId);
  if (!cart?.items.length) return null;
  const next: StoredPortalCart = { ...cart, ...patch };
  await kvSet(cartKey(actorId), next);
  return next;
}

export async function clearStoredPortalCart(actorId: string): Promise<void> {
  await kvDel(cartKey(actorId));
  await removeFromIndex(actorId);
}

export async function listStoredPortalCartActorIds(): Promise<string[]> {
  return readIndex();
}

export async function markSalesFollowUpSent(actorId: string): Promise<void> {
  const cart = await getStoredPortalCart(actorId);
  if (!cart?.items.length) return;
  await kvSet(cartKey(actorId), { ...cart, salesFollowUpAt: null, salesFollowUpSent: true });
}

export async function markCartReminderSent(actorId: string): Promise<void> {
  const cart = await getStoredPortalCart(actorId);
  if (!cart?.items.length) return;
  const reminderCount = (cart.reminderCount ?? 0) + 1;
  await kvSet(cartKey(actorId), {
    ...cart,
    reminderCount,
    // After the 2nd reminder, stop scheduling further sends.
    nextReminderAt:
      reminderCount >= CART_REMINDER_MAX_COUNT
        ? null
        : new Date(Date.now() + CART_REMINDER_INTERVAL_MS).toISOString(),
  });
}
