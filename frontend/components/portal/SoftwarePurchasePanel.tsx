"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { getProductConfig } from "@/data/product-options";
import {
  SOFTWARE_PURCHASE_CATALOG,
  formatOmanAmount,
  getProductCardMeta,
  getPurchaseProductImage,
  portalProductDetailHref,
  type SoftwarePurchaseCategory,
  type SoftwarePurchaseProduct,
} from "@/lib/order-pricing";
import { cartLineUnitPrice } from "@/lib/portal-cart-checkout";
import {
  persistPortalCartToServer,
  readPortalCart,
  syncPortalCartWithServer,
  writePortalCart,
} from "@/lib/portal-cart";
import type { PortalOrder, PurchaseType } from "@/types/orders";

type Duration = PortalOrder["duration"];
type SelectionKey = string;

function selectionKey(category: string, productName: string): SelectionKey {
  return `${category}::${productName}`;
}

type Selection = {
  category: string;
  productName: string;
  quantity: number;
  duration: Duration;
  purchaseType: PurchaseType;
  packageId?: string;
  levelId?: string;
};

export function SoftwarePurchasePanel() {
  const { user, ready: authReady } = useAuth();
  const searchParams = useSearchParams();
  const catalog = SOFTWARE_PURCHASE_CATALOG;
  const categoryFromUrl = searchParams.get("category");
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    if (categoryFromUrl && catalog.some((category) => category.id === categoryFromUrl)) {
      return categoryFromUrl;
    }
    return catalog[0]?.id ?? "";
  });
  const [cartDuration, setCartDuration] = useState<Duration>("1year");
  const [selections, setSelections] = useState<Record<SelectionKey, Selection>>({});
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!categoryFromUrl) return;
    if (catalog.some((category) => category.id === categoryFromUrl)) {
      setActiveCategoryId(categoryFromUrl);
    }
  }, [categoryFromUrl, catalog]);

  function applyCartState(cart: ReturnType<typeof readPortalCart>) {
    setCartDuration(cart.duration);
    setSelections(
      Object.fromEntries(
        cart.items.map((item) => [
          selectionKey(item.category, item.productName),
          {
            category: item.category,
            productName: item.productName,
            quantity: item.quantity,
            duration: item.duration ?? cart.duration,
            purchaseType: item.purchaseType ?? "new",
            packageId: item.packageId,
            levelId: item.levelId,
          },
        ]),
      ),
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrateCart() {
      const cart = user ? await syncPortalCartWithServer() : readPortalCart();
      if (cancelled) return;
      applyCartState(cart);
      setHydrated(true);
    }

    if (!authReady) return;
    void hydrateCart();

    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id]);

  useEffect(() => {
    if (!hydrated) return;
    const cart = {
      duration: cartDuration,
      items: Object.values(selections).map((item) => ({
        category: item.category,
        productName: item.productName,
        quantity: item.quantity,
        duration: item.duration,
        purchaseType: item.purchaseType,
        packageId: item.packageId,
        levelId: item.levelId,
      })),
    };
    writePortalCart(cart);

    if (!user) return;

    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      void persistPortalCartToServer(cart);
    }, 400);

    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [cartDuration, selections, hydrated, user]);

  const activeCategory: SoftwarePurchaseCategory | undefined =
    catalog.find((category) => category.id === activeCategoryId) ?? catalog[0];

  function scrollPills(direction: -1 | 1) {
    pillsRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  }

  function addToCart(category: SoftwarePurchaseCategory, product: SoftwarePurchaseProduct) {
    const key = selectionKey(category.label, product.name);
    const config = getProductConfig(product.name);
    setSelections((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: existing
          ? { ...existing, quantity: Math.min(999, existing.quantity + 1) }
          : {
              category: category.label,
              productName: product.name,
              quantity: 1,
              duration: "1year",
              purchaseType: "new",
              packageId: config.kind !== "bundle" ? config.packages?.[0]?.id : undefined,
              levelId: config.kind === "levels" ? config.levels[0]?.id : undefined,
            },
      };
    });
    setMessage(`${product.name} added to cart.`);
  }

  return (
    <section className="aptus-featured-solutions" aria-label="Products">
      <div className="aptus-featured-solutions__head">
        <h2>Explore our product lines</h2>
      </div>

      {message ? (
        <p role="status" className="aptus-featured-cart__success">
          {message}
        </p>
      ) : null}

      <div className="aptus-featured-solutions__filters">
        <div className="aptus-featured-solutions__pills" ref={pillsRef}>
          {catalog.map((category) => (
            <button
              key={category.id}
              type="button"
              className={
                activeCategory?.id === category.id
                  ? "aptus-featured-pill is-active"
                  : "aptus-featured-pill"
              }
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
        {catalog.length > 1 ? (
          <div className="aptus-featured-solutions__arrows">
            <button type="button" aria-label="Scroll categories left" onClick={() => scrollPills(-1)}>
              ‹
            </button>
            <button type="button" aria-label="Scroll categories right" onClick={() => scrollPills(1)}>
              ›
            </button>
          </div>
        ) : null}
      </div>

      <div className="aptus-featured-solutions__grid">
        {(activeCategory?.products ?? []).map((product) => {
          const meta = getProductCardMeta(product, activeCategory!.label);
          const key = selectionKey(activeCategory!.label, product.name);
          const selected = selections[key];
          const inCart = Boolean(selected);
          const config = getProductConfig(product.name);
          const unit = cartLineUnitPrice(
            selected ?? {
              category: activeCategory!.label,
              productName: product.name,
              quantity: 1,
              packageId: config.kind !== "bundle" ? config.packages?.[0]?.id : undefined,
              levelId: config.kind === "levels" ? config.levels[0]?.id : undefined,
            },
            "1year",
          );
          const imageSrc = getPurchaseProductImage(product.href);
          return (
            <article key={`${activeCategory!.id}-${product.href}`} className="aptus-featured-card">
              <div className="aptus-featured-card__top">
                <div className="aptus-featured-card__media">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt=""
                      className="aptus-featured-card__img"
                      loading="lazy"
                    />
                  ) : (
                    <span className="aptus-featured-card__icon" aria-hidden="true">
                      {meta.initials}
                    </span>
                  )}
                </div>
                <mark className="aptus-featured-card__badge">{meta.badge}</mark>
              </div>
              <div className="aptus-featured-card__title-row">
                <h3>{product.name}</h3>
              </div>
              <p className="aptus-featured-card__vendor">{activeCategory!.label}</p>
              <p className="aptus-featured-card__desc">{meta.description}</p>
              <div className="aptus-featured-card__foot">
                <strong className="aptus-featured-card__price">
                  {unit
                    ? config.kind === "renewal"
                      ? `${formatOmanAmount(unit)}/year`
                      : formatOmanAmount(unit)
                    : "Quote on request"}
                </strong>
                <div className="aptus-featured-card__actions">
                  <button
                    type="button"
                    className="aptus-featured-card__btn aptus-featured-card__btn--primary"
                    onClick={() => addToCart(activeCategory!, product)}
                  >
                    {inCart ? "Add another" : "Add to Cart"}
                  </button>
                  <Link
                    href={portalProductDetailHref(product)}
                    className="aptus-featured-card__btn aptus-featured-card__btn--secondary"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
