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
import { ensureSignedInForPurchase } from "@/lib/purchase-auth";
import { AutodeskFreeTrialLink } from "@/components/shared/AutodeskFreeTrialLink";
import { ProductPurchaseOptions } from "@/components/portal/ProductPurchaseOptions";
import { RenewalSerialNumberField } from "@/components/portal/RenewalSerialNumberField";
import { SoftwareBrandFilterModal } from "@/components/software/SoftwareBrandFilterModal";
import type { ProductConfig } from "@/data/product-options";
import { scheduleScrollToSoftwareCatalog, SOFTWARE_CATALOG_ANCHOR_ID } from "@/lib/scroll-to-software-catalog";
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
  serialNumber?: string;
};

const TONE_CYCLE = ["danger", "accent", "success", "warning"] as const;
const FEATURED_PURCHASABLE_COUNT = 8;

function familyFromBrandId(brandId: string): string {
  if (brandId === "elv-solutions") return "elv";
  return brandId;
}

function defaultSelection(
  brand: SoftwarePurchaseCategory,
  product: SoftwarePurchaseProduct,
  config: ProductConfig,
): Selection {
  return {
    category: brand.label,
    productName: product.name,
    quantity: 1,
    duration: "1year",
    purchaseType: "new",
    packageId: config.kind !== "bundle" ? config.packages?.[0]?.id : undefined,
    levelId: config.kind === "levels" ? config.levels[0]?.id : undefined,
  };
}

function CatalogOptionHints({ config }: { config: ProductConfig }) {
  if (config.kind === "bundle") {
    return <p className="aptus-software-catalog__option-hints">Single bundle · Quantity only</p>;
  }
  if (config.kind === "levels") {
    return (
      <p className="aptus-software-catalog__option-hints">
        Levels {config.levels.map((level) => level.label.replace("Level ", "")).join(" · ")}
      </p>
    );
  }
  return (
    <p className="aptus-software-catalog__option-hints">
      New · Renewal · 1 Year · 3 Years
      {config.packages?.length ? ` · ${config.packages.map((p) => p.label).join(" · ")}` : ""}
    </p>
  );
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
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [cardDrafts, setCardDrafts] = useState<Record<SelectionKey, Selection>>({});

  useEffect(() => {
    if (!brandFromUrl) return;
    if (catalog.some((brand) => brand.id === brandFromUrl)) {
      setActiveBrandId(brandFromUrl);
    }
  }, [brandFromUrl, catalog]);

  useEffect(() => {
    if (!brandFromUrl) return;
    scheduleScrollToSoftwareCatalog();
  }, [brandFromUrl]);

  useEffect(() => {
    setShowAllProducts(false);
  }, [activeBrandId, query]);

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
            serialNumber: item.serialNumber,
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
        serialNumber: item.serialNumber,
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

  const isDefaultView = activeBrandId === "all" && !query.trim();

  const visibleProducts = useMemo(() => {
    if (showAllProducts || !isDefaultView) return flatProducts;
    const featured = flatProducts.filter(({ product }) => isPortalPurchasableProduct(product.href));
    return featured.slice(0, FEATURED_PURCHASABLE_COUNT);
  }, [flatProducts, showAllProducts, isDefaultView]);

  const hiddenProductCount =
    isDefaultView && !showAllProducts ? Math.max(0, flatProducts.length - visibleProducts.length) : 0;

  function getCardDraft(
    brand: SoftwarePurchaseCategory,
    product: SoftwarePurchaseProduct,
    config: ProductConfig,
  ): Selection {
    const key = selectionKey(brand.label, product.name);
    return (
      cardDrafts[key] ??
      selections[key] ??
      defaultSelection(brand, product, config)
    );
  }

  function updateCardDraft(
    brand: SoftwarePurchaseCategory,
    product: SoftwarePurchaseProduct,
    patch: Partial<Selection>,
  ) {
    const key = selectionKey(brand.label, product.name);
    const config = getProductConfig(product.name);
    setCardDrafts((prev) => ({
      ...prev,
      [key]: { ...getCardDraft(brand, product, config), ...patch },
    }));
  }

  async function addToCart(brand: SoftwarePurchaseCategory, product: SoftwarePurchaseProduct) {
    if (!isPortalPurchasableProduct(product.href)) return;

    const signedIn = await ensureSignedInForPurchase(setMessage);
    if (!signedIn) return;

    const config = getProductConfig(product.name);
    const draft = getCardDraft(brand, product, config);
    if (config.kind === "renewal" && draft.purchaseType === "renew" && !draft.serialNumber?.trim()) {
      setMessage("Enter your existing serial number for renewal before adding to cart.");
      return;
    }

    const key = selectionKey(brand.label, product.name);
    setSelections((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: existing
          ? { ...existing, quantity: Math.min(999, existing.quantity + 1) }
          : { ...draft },
      };
    });
    setMessage(`${product.name} added to cart.`);
  }

  const productCount = catalog.reduce((sum, brand) => sum + brand.products.length, 0);
  const activeBrandLabel =
    activeBrandId === "all"
      ? "All brands"
      : (catalog.find((brand) => brand.id === activeBrandId)?.label ?? "All brands");

  return (
    <section
      id={SOFTWARE_CATALOG_ANCHOR_ID}
      className="aptus-software-catalog"
      aria-label="Software products"
    >
      <div className="aptus-software-catalog__inner">
        <div className="aptus-software-catalog__header">
          <h2 className="aptus-software-catalog__title">Browse all software</h2>
          <p className="aptus-software-catalog__subtitle">
            {productCount} products across {catalog.length} brands — 8 purchasable online with
            New/Renewal and 1 yr/3 yr options. View more for the full catalog.
          </p>
        </div>

        <div className="aptus-portal-products__toolbar aptus-software-catalog__toolbar">
          <label className="aptus-portal-products__search">
            <input
              type="search"
              placeholder="Search products or brands"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="aptus-brand-filter-tile"
            aria-haspopup="dialog"
            aria-expanded={brandModalOpen}
            onClick={() => setBrandModalOpen(true)}
          >
            <span className="aptus-brand-filter-tile__label">Brand</span>
            <span className="aptus-brand-filter-tile__value">{activeBrandLabel}</span>
          </button>
        </div>

        <SoftwareBrandFilterModal
          open={brandModalOpen}
          brands={catalog}
          activeBrandId={activeBrandId}
          onClose={() => setBrandModalOpen(false)}
          onSelect={setActiveBrandId}
        />

        {message ? (
          <p
            role="status"
            className={`aptus-portal-products__toast${
              message.includes("Sign in") ? " aptus-portal-products__toast--sign-in" : ""
            }`}
          >
            {message}{" "}
            {!message.includes("Sign in") ? (
              <Link href="/portal/cart" className="aptus-overview-compact__link">
                View cart
              </Link>
            ) : null}
          </p>
        ) : null}

        <div className="aptus-portal-products__grid">
          {visibleProducts.map(({ brand, product }, index) => {
            const meta = getProductCardMeta(product, brand.label);
            const key = selectionKey(brand.label, product.name);
            const selected = selections[key];
            const inCart = Boolean(selected);
            const purchasable = isPortalPurchasableProduct(product.href);
            const config = getProductConfig(product.name);
            const draft = getCardDraft(brand, product, config);
            const showSerial = purchasable && config.kind === "renewal" && draft.purchaseType === "renew";
            const unit = purchasable
              ? cartLineUnitPrice(draft, draft.duration)
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

                {purchasable ? (
                  <div className="aptus-software-catalog__purchase-options">
                    <ProductPurchaseOptions
                      config={config}
                      duration={draft.duration}
                      purchaseType={draft.purchaseType}
                      packageId={draft.packageId}
                      levelId={draft.levelId}
                      packageLayout="cards"
                      compact
                      onDurationChange={(duration) => updateCardDraft(brand, product, { duration })}
                      onPurchaseTypeChange={(purchaseType) =>
                        updateCardDraft(brand, product, {
                          purchaseType,
                          serialNumber: purchaseType === "new" ? undefined : draft.serialNumber,
                        })
                      }
                      onPackageChange={(packageId) => updateCardDraft(brand, product, { packageId })}
                      onLevelChange={(levelId) => updateCardDraft(brand, product, { levelId })}
                    />
                    {showSerial ? (
                      <RenewalSerialNumberField
                        id={`serial-${key}`}
                        value={draft.serialNumber ?? ""}
                        onChange={(serialNumber) => updateCardDraft(brand, product, { serialNumber })}
                      />
                    ) : null}
                  </div>
                ) : (
                  <CatalogOptionHints config={config} />
                )}

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
                          onClick={() => void addToCart(brand, product)}
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

        {hiddenProductCount > 0 ? (
          <div className="aptus-software-catalog__view-more-wrap">
            <button
              type="button"
              className="aptus-software-catalog__view-more"
              onClick={() => setShowAllProducts(true)}
            >
              View more ({hiddenProductCount} more products)
            </button>
          </div>
        ) : null}

        {showAllProducts && isDefaultView ? (
          <div className="aptus-software-catalog__view-more-wrap">
            <button
              type="button"
              className="aptus-software-catalog__view-more aptus-software-catalog__view-more--secondary"
              onClick={() => setShowAllProducts(false)}
            >
              Show fewer products
            </button>
          </div>
        ) : null}

        {flatProducts.length === 0 ? (
          <p className="aptus-overview-compact__empty">No products match your search.</p>
        ) : null}
      </div>
    </section>
  );
}
