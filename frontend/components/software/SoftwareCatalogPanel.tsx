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
import { SoftwareBrandFilterDropdown } from "@/components/software/SoftwareBrandFilterDropdown";
import {
  portfolioSolutionTypes,
  searchCatalogProducts,
} from "@/data/product-portfolio";
import type { ProductConfig } from "@/data/product-options";
import { scheduleScrollToSoftwareCatalog, SOFTWARE_CATALOG_ANCHOR_ID } from "@/lib/scroll-to-software-catalog";
import { parseCatalogBrandIds } from "@/lib/software-catalog-links";
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

function productFilterId(brandId: string, productName: string): string {
  return `${brandId}::${productName}`;
}

function cardsForFilters(
  catalog: readonly SoftwarePurchaseCategory[],
  filters: { brandIds: string[] | null; solutionTypes: string[] | null; query: string },
) {
  const hits = searchCatalogProducts(catalog, filters);
  return hits.flatMap((hit) => {
    const brand = catalog.find((item) => item.id === hit.brandId);
    if (!brand) return [];
    const existing = brand.products.find(
      (product) => product.name === hit.productName && product.href === hit.href,
    );
    const product: SoftwarePurchaseProduct = existing ?? {
      name: hit.productName,
      href: hit.href,
    };
    return [{ brand, product }];
  });
}

export function SoftwareCatalogPanel({ solutionType }: { solutionType?: string }) {
  const { openQuote } = useQuoteModal();
  const searchParams = useSearchParams();
  const catalog = SOFTWARE_FULL_CATALOG;
  const brandFromUrl = searchParams.get("brand");
  const brandIdsFromUrl = useMemo(() => {
    const valid = new Set(catalog.map((brand) => brand.id));
    return parseCatalogBrandIds(brandFromUrl).filter((id) => valid.has(id));
  }, [brandFromUrl, catalog]);
  const brandFilterKey = brandIdsFromUrl.join(",");
  const [user, setUser] = useState<ClientProfile | null>(null);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[] | null>(() =>
    brandIdsFromUrl.length ? brandIdsFromUrl : null,
  );
  const [cartDuration, setCartDuration] = useState<Duration>("1year");
  const [selections, setSelections] = useState<Record<SelectionKey, Selection>>({});
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brandFilterOpen, setBrandFilterOpen] = useState(false);
  const [solutionFilterOpen, setSolutionFilterOpen] = useState(false);
  const [productFilterOpen, setProductFilterOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[] | null>(null);
  const [selectedSolutionTypes, setSelectedSolutionTypes] = useState<string[] | null>(() =>
    solutionType ? [solutionType] : null,
  );
  const [showAllProducts, setShowAllProducts] = useState(false);
  const solutionTypes = useMemo(() => portfolioSolutionTypes(), []);
  const [cardDrafts, setCardDrafts] = useState<Record<SelectionKey, Selection>>({});

  useEffect(() => {
    if (!brandFromUrl) return;
    setSelectedBrandIds(brandIdsFromUrl.length ? brandIdsFromUrl : null);
  }, [brandFromUrl, brandFilterKey, brandIdsFromUrl]);

  useEffect(() => {
    if (!brandIdsFromUrl.length) return;
    scheduleScrollToSoftwareCatalog();
  }, [brandFilterKey, brandIdsFromUrl.length]);

  useEffect(() => {
    setShowAllProducts(false);
  }, [selectedBrandIds, selectedSolutionTypes, selectedProductIds, query]);

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

  const solutionCards = useMemo(
    () =>
      solutionType
        ? cardsForFilters(catalog, { brandIds: null, solutionTypes: [solutionType], query: "" })
        : [],
    [catalog, solutionType],
  );

  const flatProducts = useMemo(() => {
    if (!solutionType) {
      return cardsForFilters(catalog, {
        brandIds: selectedBrandIds,
        solutionTypes: selectedSolutionTypes,
        query,
      });
    }
    const needle = query.trim().toLowerCase();
    return solutionCards.filter(({ brand, product }) => {
      if (selectedBrandIds && !selectedBrandIds.includes(brand.id)) return false;
      if (selectedProductIds && !selectedProductIds.includes(productFilterId(brand.id, product.name))) return false;
      if (!needle) return true;
      return `${product.name} ${brand.label}`.toLowerCase().includes(needle);
    });
  }, [catalog, query, selectedBrandIds, selectedProductIds, selectedSolutionTypes, solutionCards, solutionType]);

  const isDefaultView =
    !solutionType && selectedBrandIds === null && selectedSolutionTypes === null && !query.trim();

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
    const existing = selections[key];
    const nextItem = existing
      ? { ...existing, quantity: Math.min(999, existing.quantity + 1) }
      : { ...draft };
    const nextSelections = { ...selections, [key]: nextItem };
    setSelections(nextSelections);

    const cart = {
      duration: cartDuration,
      items: Object.values(nextSelections).map((item) => ({
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
    void persistPortalCartToServer(cart);
    setMessage(`${product.name} added to cart.`);
  }

  const productCount = catalog.reduce((sum, brand) => sum + brand.products.length, 0);
  const activeBrandLabel =
    selectedBrandIds === null
      ? "All brands"
      : selectedBrandIds.length === 0
        ? "No brands"
        : selectedBrandIds.length === 1
          ? (catalog.find((brand) => brand.id === selectedBrandIds[0])?.label ?? "1 brand")
          : `${selectedBrandIds.length} brands`;
  const solutionBrandOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { id: string; label: string }[] = [];
    for (const { brand } of solutionCards) {
      if (seen.has(brand.id)) continue;
      seen.add(brand.id);
      options.push({ id: brand.id, label: brand.label });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [solutionCards]);

  const solutionProductOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { id: string; label: string }[] = [];
    for (const { brand, product } of solutionCards) {
      if (selectedBrandIds && !selectedBrandIds.includes(brand.id)) continue;
      const id = productFilterId(brand.id, product.name);
      if (seen.has(id)) continue;
      seen.add(id);
      options.push({ id, label: product.name });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedBrandIds, solutionCards]);

  function onSolutionBrandsChange(ids: string[] | null) {
    setSelectedBrandIds(ids);
    setSelectedProductIds((current) => {
      if (!current) return null;
      const allowed = new Set(
        solutionCards
          .filter(({ brand }) => ids === null || ids.includes(brand.id))
          .map(({ brand, product }) => productFilterId(brand.id, product.name)),
      );
      const next = current.filter((id) => allowed.has(id));
      if (next.length === 0 || next.length === allowed.size) return null;
      return next;
    });
  }

  const activeProductLabel =
    selectedProductIds === null
      ? "All products"
      : selectedProductIds.length === 0
        ? "No products"
        : selectedProductIds.length === 1
          ? (solutionProductOptions.find((option) => option.id === selectedProductIds[0])?.label ?? "1 product")
          : `${selectedProductIds.length} products`;
  const activeSolutionLabel =
    selectedSolutionTypes === null
      ? "All solutions"
      : selectedSolutionTypes.length === 0
        ? "No solutions"
        : selectedSolutionTypes.length === 1
          ? selectedSolutionTypes[0]!
          : `${selectedSolutionTypes.length} solutions`;

  return (
    <section
      id={SOFTWARE_CATALOG_ANCHOR_ID}
      className={`aptus-software-catalog${solutionType ? " aptus-software-catalog--solution" : ""}`}
      aria-label="Software products"
    >
      <div className="aptus-software-catalog__inner">
        {solutionType ? (
          <div className="aptus-portal-products__toolbar aptus-software-catalog__toolbar">
            <label className="aptus-portal-products__search aptus-software-catalog__search">
              <input
                type="search"
                placeholder="Search products or brands"
                aria-label="Search products or brands"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="aptus-software-catalog__filters">
              <SoftwareBrandFilterDropdown
                open={brandFilterOpen}
                options={solutionBrandOptions}
                selectedIds={selectedBrandIds}
                activeLabel={activeBrandLabel}
                fieldLabel="Brand"
                allLabel="All brands"
                menuLabel="Filter by brand"
                keepLabels
                onOpenChange={(open) => {
                  setBrandFilterOpen(open);
                  if (open) setProductFilterOpen(false);
                }}
                onChange={onSolutionBrandsChange}
              />
              <SoftwareBrandFilterDropdown
                open={productFilterOpen}
                options={solutionProductOptions}
                selectedIds={selectedProductIds}
                activeLabel={activeProductLabel}
                fieldLabel="Product"
                allLabel="All products"
                menuLabel="Filter by product"
                keepLabels
                onOpenChange={(open) => {
                  setProductFilterOpen(open);
                  if (open) setBrandFilterOpen(false);
                }}
                onChange={setSelectedProductIds}
              />
            </div>
          </div>
        ) : (
          <>
        <div className="aptus-software-catalog__header">
          <h2 className="aptus-software-catalog__title">Browse all software</h2>
          <p className="aptus-software-catalog__subtitle">
            {productCount} products across {catalog.length} brands — 8 purchasable online with
            New/Renewal and 1 yr/3 yr options. View more for the full catalog.
          </p>
        </div>

        <div className="aptus-portal-products__toolbar aptus-software-catalog__toolbar">
          <label className="aptus-portal-products__search aptus-software-catalog__search">
            <input
              type="search"
              placeholder="Search products, brands, or solutions"
              aria-label="Search products, brands, or solutions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="aptus-software-catalog__filters">
            <SoftwareBrandFilterDropdown
              open={solutionFilterOpen}
              options={solutionTypes.map((label) => ({ id: label, label }))}
              selectedIds={selectedSolutionTypes}
              activeLabel={activeSolutionLabel}
              fieldLabel="Solution type"
              allLabel="All solutions"
              menuLabel="Filter by solution type"
              onOpenChange={(open) => {
                setSolutionFilterOpen(open);
                if (open) setBrandFilterOpen(false);
              }}
              onChange={setSelectedSolutionTypes}
            />
            <SoftwareBrandFilterDropdown
              open={brandFilterOpen}
              options={catalog.map((brand) => ({ id: brand.id, label: brand.label }))}
              selectedIds={selectedBrandIds}
              activeLabel={activeBrandLabel}
              fieldLabel="Brand"
              allLabel="All brands"
              menuLabel="Filter by brand"
              keepLabels
              onOpenChange={(open) => {
                setBrandFilterOpen(open);
                if (open) setSolutionFilterOpen(false);
              }}
              onChange={setSelectedBrandIds}
            />
          </div>
        </div>
          </>
        )}

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

        {visibleProducts.length === 0 ? (
          <p className="aptus-software-catalog__subtitle">No products match these filters.</p>
        ) : (
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
            const listedInCatalog = brand.products.some(
              (item) => item.name === product.name && item.href === product.href,
            );

            return (
              <article
                key={`${brand.id}-${product.href}-${product.name}`}
                className={`aptus-portal-products__card aptus-software-catalog__card aptus-software-catalog__card--${tone}`}
              >
                <div className="aptus-software-catalog__card-head">
                  <div className="aptus-software-catalog__card-meta">
                    <p className="aptus-portal-products__name" data-no-translate="">
                      {product.name}
                    </p>
                    <p className="aptus-portal-products__cat" data-no-translate="">
                      {brand.label}
                    </p>
                  </div>
                  {imageSrc ? (
                    <div className="aptus-software-catalog__thumb aptus-software-catalog__thumb--corner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageSrc} alt="" loading="lazy" />
                    </div>
                  ) : (
                    <div
                      className={`aptus-software-catalog__corner-icon aptus-portal-products__icon aptus-portal-products__icon--${tone}`}
                      aria-hidden
                      data-no-translate=""
                    >
                      {meta.initials}
                    </div>
                  )}
                </div>

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
                  {purchasable && unit ? (
                    <span className="aptus-portal-products__price">
                      {config.kind === "renewal"
                        ? `${formatOmanAmount(unit)}/year`
                        : formatOmanAmount(unit)}
                    </span>
                  ) : null}
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
                    <Link
                      href={listedInCatalog ? productDetailHref(product) : product.href}
                      className="aptus-overview-compact__link"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        )}

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
