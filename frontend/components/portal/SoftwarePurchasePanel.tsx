"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { getProductConfig } from "@/data/product-options";
import {
  SOFTWARE_PURCHASE_CATALOG,
  formatOmanAmount,
  getProductCardMeta,
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

const TONE_CYCLE = ["danger", "accent", "success", "warning"] as const;

export function SoftwarePurchasePanel() {
  const { user, ready: authReady } = useAuth();
  const searchParams = useSearchParams();
  const catalog = SOFTWARE_PURCHASE_CATALOG;
  const categoryFromUrl = searchParams.get("category");
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    if (categoryFromUrl && catalog.some((category) => category.id === categoryFromUrl)) {
      return categoryFromUrl;
    }
    return "all";
  });
  const [cartDuration, setCartDuration] = useState<Duration>("1year");
  const [selections, setSelections] = useState<Record<SelectionKey, Selection>>({});
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

    const timer = setTimeout(() => {
      void persistPortalCartToServer(cart);
    }, 400);

    return () => clearTimeout(timer);
  }, [cartDuration, selections, hydrated, user]);

  const flatProducts = useMemo(() => {
    const rows: Array<{
      category: SoftwarePurchaseCategory;
      product: SoftwarePurchaseProduct;
    }> = [];
    for (const category of catalog) {
      if (activeCategoryId !== "all" && category.id !== activeCategoryId) continue;
      for (const product of category.products) {
        rows.push({ category, product });
      }
    }
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      ({ category, product }) =>
        product.name.toLowerCase().includes(q) || category.label.toLowerCase().includes(q),
    );
  }, [catalog, activeCategoryId, query]);

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
    <section className="aptus-portal-products" aria-label="Products">
      <div className="aptus-portal-products__toolbar">
        <label className="aptus-portal-products__search">
          <input
            type="search"
            placeholder="Search products"
            aria-label="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="aptus-portal-chips" role="tablist" aria-label="Product categories">
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryId === "all"}
          className={`aptus-portal-chip${activeCategoryId === "all" ? " is-active" : ""}`}
          onClick={() => setActiveCategoryId("all")}
        >
          All
        </button>
        {catalog.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={activeCategoryId === category.id}
            className={`aptus-portal-chip${activeCategoryId === category.id ? " is-active" : ""}`}
            onClick={() => setActiveCategoryId(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {message ? (
        <p role="status" className="aptus-portal-products__toast">
          {message}{" "}
          <Link href="/portal/cart" className="aptus-overview-compact__link">
            View cart
          </Link>
        </p>
      ) : null}

      <div className="aptus-portal-products__grid">
        {flatProducts.map(({ category, product }, index) => {
          const meta = getProductCardMeta(product, category.label);
          const key = selectionKey(category.label, product.name);
          const selected = selections[key];
          const inCart = Boolean(selected);
          const config = getProductConfig(product.name);
          const unit = cartLineUnitPrice(
            selected ?? {
              category: category.label,
              productName: product.name,
              quantity: 1,
              packageId: config.kind !== "bundle" ? config.packages?.[0]?.id : undefined,
              levelId: config.kind === "levels" ? config.levels[0]?.id : undefined,
            },
            "1year",
          );
          const tone = TONE_CYCLE[index % TONE_CYCLE.length];

          return (
            <article key={`${category.id}-${product.href}`} className="aptus-portal-products__card">
              <div className={`aptus-portal-products__icon aptus-portal-products__icon--${tone}`} aria-hidden>
                {meta.initials}
              </div>
              <p className="aptus-portal-products__name">{product.name}</p>
              <p className="aptus-portal-products__cat">{category.label}</p>
              <div className="aptus-portal-products__foot">
                <span className="aptus-portal-products__price">
                  {unit
                    ? config.kind === "renewal"
                      ? `${formatOmanAmount(unit)}/year`
                      : formatOmanAmount(unit)
                    : "Quote on request"}
                </span>
                <div className="aptus-portal-products__actions">
                  <button type="button" className="aptus-portal-btn" onClick={() => addToCart(category, product)}>
                    {inCart ? "Add another" : "Add to cart"}
                  </button>
                  <Link href={portalProductDetailHref(product)} className="aptus-overview-compact__link">
                    Details
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {flatProducts.length === 0 ? (
        <p className="aptus-overview-compact__empty">No products match your search.</p>
      ) : null}
    </section>
  );
}
