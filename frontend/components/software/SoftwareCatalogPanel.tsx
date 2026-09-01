"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuoteModal } from "@/components/quote/QuoteModalProvider";
import { quoteContextForPortalProduct } from "@/components/quote/quote-modal-utils";
import { getProductConfig } from "@/data/product-options";
import {
  isPortalPurchasableProduct,
  productDetailHref,
  SOFTWARE_FULL_CATALOG,
} from "@/data/software-full-catalog";
import {
  formatOmanAmount,
  getProductCardMeta,
  getPurchaseProductImage,
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
import { fetchAuthMeShared } from "@/lib/auth-me-client";
import { AutodeskFreeTrialLink } from "@/components/shared/AutodeskFreeTrialLink";
import type { ClientProfile } from "@/types/profile";
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

function familyFromBrandId(brandId: string): string {
  if (brandId === "elv-solutions") return "elv";
  return brandId;
}

export function SoftwareCatalogPanel() {
  const { openQuote } = useQuoteModal();
  const searchParams = useSearchParams();
  const catalog = SOFTWARE_FULL_CATALOG;
  const brandFromUrl = searchParams.get("brand");
  const [user, setUser] = useState<ClientProfile | null>(null);
  const [activeBrandId, setActiveBrandId] = useState(() => {
    if (brandFromUrl && catalog.some((brand) => brand.id === brandFromUrl)) {
      return brandFromUrl;
    }
    return "all";
  });
  const [cartDuration, setCartDuration] = useState<Duration>("1year");
  const [selections, setSelections] = useState<Record<SelectionKey, Selection>>({});
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!brandFromUrl) return;
    if (catalog.some((brand) => brand.id === brandFromUrl)) {
      setActiveBrandId(brandFromUrl);
    }
  }, [brandFromUrl, catalog]);

  useEffect(() => {
    if (!brandFromUrl) return;
    const timer = window.setTimeout(() => {
      document.getElementById("software-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [brandFromUrl]);

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
      const me = await fetchAuthMeShared();
      const loggedIn = me.ok ? me.user : null;
      if (cancelled) return;
      setUser(loggedIn);

      const cart = loggedIn ? await syncPortalCartWithServer() : readPortalCart();
      if (cancelled) return;
      applyCartState(cart);
      setHydrated(true);
    }

    void hydrateCart();

    return () => {
      cancelled = true;
    };
  }, []);

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
      brand: SoftwarePurchaseCategory;
      product: SoftwarePurchaseProduct;
    }> = [];
    for (const brand of catalog) {
      if (activeBrandId !== "all" && brand.id !== activeBrandId) continue;
      for (const product of brand.products) {
        rows.push({ brand, product });
      }
    }
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      ({ brand, product }) =>
        product.name.toLowerCase().includes(q) || brand.label.toLowerCase().includes(q),
    );
  }, [catalog, activeBrandId, query]);

  function addToCart(brand: SoftwarePurchaseCategory, product: SoftwarePurchaseProduct) {
    if (!isPortalPurchasableProduct(product.href)) return;
    const key = selectionKey(brand.label, product.name);
    const config = getProductConfig(product.name);
    setSelections((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: existing
          ? { ...existing, quantity: Math.min(999, existing.quantity + 1) }
          : {
              category: brand.label,
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

  const productCount = catalog.reduce((sum, brand) => sum + brand.products.length, 0);

  return (
    <section className="aptus-software-catalog" aria-label="Software products">
      <div className="aptus-software-catalog__inner">
        <div className="aptus-software-catalog__header">
          <h2 className="aptus-software-catalog__title">Browse all software</h2>
          <p className="aptus-software-catalog__subtitle">
            {productCount} products across {catalog.length} brands — search, filter by brand, and
            purchase online or request a quote.
          </p>
        </div>

        <div className="aptus-portal-products__toolbar">
          <label className="aptus-portal-products__search">
            <input
              type="search"
              placeholder="Search products or brands"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="aptus-portal-chips" role="tablist" aria-label="Software brands">
          <button
            type="button"
            role="tab"
            aria-selected={activeBrandId === "all"}
            className={`aptus-portal-chip${activeBrandId === "all" ? " is-active" : ""}`}
            onClick={() => setActiveBrandId("all")}
          >
            All brands
          </button>
          {catalog.map((brand) => (
            <button
              key={brand.id}
              type="button"
              role="tab"
              aria-selected={activeBrandId === brand.id}
              className={`aptus-portal-chip${activeBrandId === brand.id ? " is-active" : ""}`}
              onClick={() => setActiveBrandId(brand.id)}
            >
              {brand.label}
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
          {flatProducts.map(({ brand, product }, index) => {
            const meta = getProductCardMeta(product, brand.label);
            const key = selectionKey(brand.label, product.name);
            const selected = selections[key];
            const inCart = Boolean(selected);
            const purchasable = isPortalPurchasableProduct(product.href);
            const config = getProductConfig(product.name);
            const unit = purchasable
              ? cartLineUnitPrice(
                  selected ?? {
                    category: brand.label,
                    productName: product.name,
                    quantity: 1,
                    packageId: config.kind !== "bundle" ? config.packages?.[0]?.id : undefined,
                    levelId: config.kind === "levels" ? config.levels[0]?.id : undefined,
                  },
                  "1year",
                )
              : undefined;
            const tone = TONE_CYCLE[index % TONE_CYCLE.length];
            const imageSrc = getPurchaseProductImage(product.href);

            return (
              <article
                key={`${brand.id}-${product.href}`}
                className="aptus-portal-products__card aptus-software-catalog__card"
              >
                {imageSrc ? (
                  <div className="aptus-software-catalog__thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc} alt="" loading="lazy" />
                  </div>
                ) : (
                  <div
                    className={`aptus-portal-products__icon aptus-portal-products__icon--${tone}`}
                    aria-hidden
                  >
                    {meta.initials}
                  </div>
                )}
                <p className="aptus-portal-products__name">{product.name}</p>
                <p className="aptus-portal-products__cat">{brand.label}</p>
                <div className="aptus-portal-products__foot">
                  <span className="aptus-portal-products__price">
                    {purchasable && unit
                      ? config.kind === "renewal"
                        ? `${formatOmanAmount(unit)}/year`
                        : formatOmanAmount(unit)
                      : "Quote on request"}
                  </span>
                  <div className="aptus-portal-products__actions">
                    {purchasable ? (
                      <>
                        <button
                          type="button"
                          className="aptus-portal-btn"
                          onClick={() => addToCart(brand, product)}
                        >
                          {inCart ? "Add another" : "Add to cart"}
                        </button>
                        <AutodeskFreeTrialLink productHref={product.href} variant="portal-card" />
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="aptus-portal-btn aptus-portal-btn--primary"
                      onClick={() =>
                        openQuote(
                          quoteContextForPortalProduct({
                            family: familyFromBrandId(brand.id),
                            productName: product.name,
                            productHref: product.href,
                          }),
                        )
                      }
                    >
                      Request Quote
                    </button>
                    <Link href={productDetailHref(product)} className="aptus-overview-compact__link">
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
      </div>
    </section>
  );
}
