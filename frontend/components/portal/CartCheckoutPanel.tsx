"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { authFetch } from "@/lib/access-token";
import {
  formatOmanAmount,
  getProductCardMeta,
  getPurchaseProductImage,
  type OrderPricing,
} from "@/lib/order-pricing";
import { getProductConfig } from "@/data/product-options";
import { lookupPurchaseProduct } from "@/data/software-purchase-catalog";
import {
  CHECKOUT_STEPS,
  cartLineTotal,
  cartLineUnitPrice,
  checkoutStepperIndex,
  estimateCartPricing,
  lineConfigSummary,
  productInitials,
  resolveLineDuration,
  type CartCheckoutStep,
} from "@/lib/portal-cart-checkout";
import { normalizePhone } from "@/lib/phone";
import {
  clearPortalCartEverywhere,
  persistPortalCartToServer,
  portalCartCount,
  readPortalCart,
  syncPortalCartWithServer,
  writePortalCart,
  type PortalCartItem,
  type PortalCartState,
} from "@/lib/portal-cart";
import { OrderPaymentModal } from "./OrderPaymentModal";
import { ProductPurchaseOptions } from "./ProductPurchaseOptions";
import type { PortalOrder } from "@/types/orders";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  );
}

function CheckoutStepper({ activeStep }: { activeStep: number }) {
  return (
    <nav className="aptus-cart-stepper" aria-label="Checkout progress">
      {CHECKOUT_STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const done = activeStep > stepNumber;
        const current = activeStep === stepNumber;
        return (
          <div key={label} className="aptus-cart-stepper__item">
            <div className="aptus-cart-stepper__node-wrap">
              <span
                className={
                  done
                    ? "aptus-cart-stepper__node is-done"
                    : current
                      ? "aptus-cart-stepper__node is-current"
                      : "aptus-cart-stepper__node"
                }
              >
                {done ? <CheckIcon /> : stepNumber}
              </span>
              <span
                className={
                  current
                    ? "aptus-cart-stepper__label is-current"
                    : done
                      ? "aptus-cart-stepper__label is-done"
                      : "aptus-cart-stepper__label"
                }
              >
                {label}
              </span>
            </div>
            {index < CHECKOUT_STEPS.length - 1 ? (
              <span
                className={
                  activeStep > stepNumber
                    ? "aptus-cart-stepper__line is-done"
                    : "aptus-cart-stepper__line"
                }
                aria-hidden="true"
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

type CheckoutForm = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company: string;
  taxId: string;
  country: string;
  city: string;
  customerMessage: string;
};

export function CartCheckoutPanel() {
  const router = useRouter();
  const { user, ready: authReady } = useAuth();
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentDoneRef = useRef(false);

  const [cart, setCart] = useState<PortalCartState>({ duration: "1year", items: [] });
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<CartCheckoutStep>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<PortalOrder | null>(null);
  const [checkout, setCheckout] = useState<CheckoutForm>({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    company: "",
    taxId: "",
    country: "Oman",
    city: "",
    customerMessage: "",
  });

  const pricing = useMemo<OrderPricing | null>(
    () => (cart.items.length ? estimateCartPricing(cart) : null),
    [cart],
  );

  const activeStep = checkoutStepperIndex(step, paymentOrder !== null);
  const itemCount = portalCartCount(cart);

  useEffect(() => {
    if (!user) return;
    setCheckout((prev) => ({
      ...prev,
      contactName: user.name || prev.contactName,
      contactEmail: user.email || prev.contactEmail,
      contactPhone: normalizePhone(user.phone || prev.contactPhone),
      company: user.company || prev.company,
      taxId: user.taxId || prev.taxId,
      country: user.country || prev.country || "Oman",
      city: user.city || prev.city,
    }));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const next = user ? await syncPortalCartWithServer() : readPortalCart();
      if (cancelled) return;
      setCart(next);
      setHydrated(true);
    }

    if (!authReady) return;
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id]);

  const persistCart = useCallback(
    (next: PortalCartState) => {
      setCart(next);
      writePortalCart(next);
      if (!user) return;
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => {
        void persistPortalCartToServer(next);
      }, 400);
    },
    [user],
  );

  useEffect(
    () => () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    },
    [],
  );

  function updateLine(category: string, productName: string, patch: Partial<PortalCartItem>) {
    persistCart({
      ...cart,
      items: cart.items.map((item) =>
        item.category === category && item.productName === productName
          ? { ...item, ...patch }
          : item,
      ),
    });
  }

  function updateQuantity(category: string, productName: string, quantity: number) {
    updateLine(category, productName, {
      quantity: Math.min(999, Math.max(1, Math.floor(quantity) || 1)),
    });
  }

  function removeItem(category: string, productName: string) {
    persistCart({
      ...cart,
      items: cart.items.filter(
        (item) => !(item.category === category && item.productName === productName),
      ),
    });
  }

  async function submitOrder() {
    if (!cart.items.length) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await authFetch("/api/orders/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: cart.duration,
          items: cart.items.map((item) => ({
            ...item,
            duration: resolveLineDuration(item, cart.duration),
          })),
          contactName: checkout.contactName.trim() || undefined,
          contactEmail: checkout.contactEmail.trim() || undefined,
          contactPhone: normalizePhone(checkout.contactPhone) || undefined,
          customerMessage: checkout.customerMessage.trim() || undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        reference?: string;
        order?: PortalOrder;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not submit your order. Please try again.");
        return;
      }

      // Nothing is purchased yet — /api/orders/place only prepares the order to pay
      // for. The cart stays intact so the customer can go back or retry a failed
      // payment; it is cleared once the payment step reports success (onPaid).
      if (data.order) {
        setPaymentOrder({
          ...data.order,
          duration: cart.duration,
          items: cart.items.map((item) => ({
            ...item,
            duration: resolveLineDuration(item, cart.duration),
          })),
          amountDue: pricing?.total ?? data.order.amountDue,
        });
      } else {
        setError("Could not open the payment step. Please try again.");
      }
    } catch {
      setError("Could not submit your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <section className="aptus-cart-checkout" aria-label="Shopping cart">
        <p className="aptus-cart-checkout__loading">Loading your cart…</p>
      </section>
    );
  }

  return (
    <section className="aptus-cart-checkout" aria-label="Shopping cart">
      <CheckoutStepper activeStep={activeStep} />

      {step === "cart" ? (
        <div className="aptus-cart-checkout__layout">
          <div className="aptus-cart-checkout__main">
            <div className="aptus-cart-checkout__head">
              <h2>Shopping Cart</h2>
              <div className="aptus-cart-checkout__head-meta">
                <span>
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>
                <Link href="/software-solutions" className="aptus-overview-compact__link">
                  Continue shopping
                </Link>
              </div>
            </div>

            {cart.items.length === 0 ? (
              <div className="aptus-cart-checkout__empty">
                <p>Your cart is empty.</p>
                <Link href="/software-solutions" className="btn btn-aptus-primary">
                  Browse products
                </Link>
              </div>
            ) : (
              <>
                <div className="aptus-cart-table-wrap">
                  <table className="aptus-cart-table">
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col">Configuration</th>
                        <th scope="col">Qty</th>
                        <th scope="col" className="aptus-cart-table__num">
                          Price
                        </th>
                        <th scope="col" className="aptus-cart-table__num">
                          Total
                        </th>
                        <th scope="col">
                          <span className="visually-hidden">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.items.map((item) => {
                        const config = getProductConfig(item.productName);
                        const unit = cartLineUnitPrice(item, cart.duration);
                        const lineTotal = cartLineTotal(item, cart.duration);
                        const catalogProduct = lookupPurchaseProduct(
                          item.productName,
                          item.category,
                        );
                        const imageSrc = catalogProduct
                          ? getPurchaseProductImage(catalogProduct.href)
                          : undefined;
                        const initials = catalogProduct
                          ? getProductCardMeta(catalogProduct, item.category).initials
                          : productInitials(item.productName);
                        return (
                          <tr key={`${item.category}-${item.productName}`}>
                            <td data-label="Product">
                              <div className="aptus-cart-table__product">
                                <span className="aptus-cart-table__media" aria-hidden="true">
                                  {imageSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={imageSrc} alt="" loading="lazy" />
                                  ) : (
                                    <span className="aptus-cart-table__avatar">{initials}</span>
                                  )}
                                </span>
                                <div>
                                  <strong>{item.productName}</strong>
                                  <span>{item.category}</span>
                                </div>
                              </div>
                            </td>
                            <td data-label="Configuration">
                              {config.kind === "bundle" ? (
                                <span className="aptus-cart-table__term">Bundle</span>
                              ) : (
                                <ProductPurchaseOptions
                                  compact
                                  className="aptus-cart-table__options"
                                  config={config}
                                  duration={resolveLineDuration(item, cart.duration)}
                                  purchaseType={item.purchaseType ?? "new"}
                                  packageId={item.packageId}
                                  levelId={item.levelId}
                                  onDurationChange={(duration) =>
                                    updateLine(item.category, item.productName, { duration })
                                  }
                                  onPurchaseTypeChange={(purchaseType) =>
                                    updateLine(item.category, item.productName, { purchaseType })
                                  }
                                  onPackageChange={(packageId) =>
                                    updateLine(item.category, item.productName, { packageId })
                                  }
                                  onLevelChange={(levelId) =>
                                    updateLine(item.category, item.productName, { levelId })
                                  }
                                />
                              )}
                            </td>
                            <td data-label="Qty">
                              <select
                                className="aptus-cart-table__qty"
                                value={item.quantity}
                                aria-label={`Quantity for ${item.productName}`}
                                onChange={(event) =>
                                  updateQuantity(
                                    item.category,
                                    item.productName,
                                    Number(event.target.value),
                                  )
                                }
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="aptus-cart-table__num" data-label="Price">
                              {unit > 0 ? formatOmanAmount(unit) : "Quote"}
                            </td>
                            <td className="aptus-cart-table__num" data-label="Total">
                              {lineTotal > 0 ? formatOmanAmount(lineTotal) : "—"}
                            </td>
                            <td data-label="Remove">
                              <button
                                type="button"
                                className="aptus-cart-table__remove"
                                aria-label={`Remove ${item.productName}`}
                                onClick={() => removeItem(item.category, item.productName)}
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <aside className="aptus-cart-summary">
            <h3>Order Summary</h3>
            {pricing && pricing.total > 0 ? (
              <dl className="aptus-cart-summary__rows">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatOmanAmount(pricing.subscriptionFee)}</dd>
                </div>
                <div>
                  <dt>VAT (5%)</dt>
                  <dd>{formatOmanAmount(pricing.vat)}</dd>
                </div>
                <div className="aptus-cart-summary__total">
                  <dt>Total</dt>
                  <dd>{formatOmanAmount(pricing.total)}</dd>
                </div>
              </dl>
            ) : (
              <p className="aptus-cart-summary__note">
                Guide pricing appears when catalog prices are available. Final amount confirmed after review.
              </p>
            )}
            <button
              type="button"
              className="btn btn-aptus-primary w-100"
              disabled={cart.items.length === 0}
              onClick={() => {
                setError(null);
                setStep("checkout");
              }}
            >
              Proceed to Checkout →
            </button>
            <Link href="/software-solutions" className="aptus-cart-summary__back">
              ← Continue Shopping
            </Link>
          </aside>
        </div>
      ) : null}

      {step === "checkout" ? (
        <div className="aptus-cart-checkout__layout">
          <div className="aptus-cart-checkout__main aptus-cart-checkout__forms">
            <div className="aptus-cart-checkout__card">
              <h2>Customer Details</h2>
              <div className="aptus-cart-checkout__grid">
                <label>
                  <span>Company Name</span>
                  <input
                    value={checkout.company}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, company: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Contact Person</span>
                  <input
                    value={checkout.contactName}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, contactName: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={checkout.contactEmail}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, contactEmail: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Phone Number</span>
                  <input
                    value={checkout.contactPhone}
                    onChange={(event) =>
                      setCheckout((prev) => ({
                        ...prev,
                        contactPhone: normalizePhone(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="aptus-cart-checkout__full">
                  <span>VAT / Tax ID</span>
                  <input
                    value={checkout.taxId}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, taxId: event.target.value }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="aptus-cart-checkout__card">
              <h2>Billing Address</h2>
              <div className="aptus-cart-checkout__grid">
                <label>
                  <span>Country</span>
                  <select
                    value={checkout.country}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, country: event.target.value }))
                    }
                  >
                    <option value="Oman">Oman</option>
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Qatar">Qatar</option>
                  </select>
                </label>
                <label>
                  <span>City</span>
                  <input
                    value={checkout.city}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, city: event.target.value }))
                    }
                  />
                </label>
                <label className="aptus-cart-checkout__full">
                  <span>Notes for the Software Team (optional)</span>
                  <textarea
                    rows={3}
                    value={checkout.customerMessage}
                    onChange={(event) =>
                      setCheckout((prev) => ({ ...prev, customerMessage: event.target.value }))
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          <aside className="aptus-cart-summary">
            <h3>Order Summary</h3>
            <ul className="aptus-cart-summary__lines">
              {cart.items.map((item) => (
                <li key={`${item.category}-${item.productName}`}>
                    <span>
                      {item.productName} ×{item.quantity} ({lineConfigSummary(item, cart.duration)})
                    </span>
                    <span>
                      {cartLineTotal(item, cart.duration) > 0
                        ? formatOmanAmount(cartLineTotal(item, cart.duration))
                        : "Quote"}
                    </span>
                  </li>
              ))}
            </ul>
            {pricing && pricing.total > 0 ? (
              <p className="aptus-cart-summary__total-inline">
                Total <strong>{formatOmanAmount(pricing.total)}</strong>
              </p>
            ) : null}
            <button
              type="button"
              className="btn btn-aptus-primary w-100"
              disabled={submitting || cart.items.length === 0}
              onClick={() => void submitOrder()}
            >
              {submitting ? "Submitting…" : "Continue to payment →"}
            </button>
            <button
              type="button"
              className="aptus-cart-summary__back aptus-cart-summary__back-btn"
              onClick={() => setStep("cart")}
            >
              ← Back to cart
            </button>
            {error ? (
              <p className="aptus-field__error" role="alert">
                {error}
              </p>
            ) : null}
          </aside>
        </div>
      ) : null}

      <OrderPaymentModal
        order={paymentOrder}
        open={paymentOrder !== null}
        onPaid={() => {
          paymentDoneRef.current = true;
          setCart({ duration: "1year", items: [] });
          void clearPortalCartEverywhere();
        }}
        onClose={() => {
          setPaymentOrder(null);
          if (paymentDoneRef.current) {
            paymentDoneRef.current = false;
            router.push("/portal/dashboard");
          }
        }}
      />
    </section>
  );
}
