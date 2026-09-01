"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuoteModal } from "@/components/quote/QuoteModalProvider";
import { quoteContextForPortalProduct } from "@/components/quote/quote-modal-utils";
import { getProductCatalogTitle } from "@/data/product-catalog-titles";
import { getProductConfig } from "@/data/product-options";
import {
  getProductDetailContent,
  type ProductDetailBlock,
} from "@/data/product-detail-content";
import { isPortalPurchasableProduct } from "@/data/software-full-catalog";
import {
  formatOmanAmount,
  getProductCardMeta,
  getPurchaseProductImage,
  type SoftwarePurchaseCategory,
  type SoftwarePurchaseProduct,
} from "@/lib/order-pricing";
import { lookupPortalSku, productSlugFromHref } from "@/data/software-purchase-catalog";
import { cartLineUnitPrice } from "@/lib/portal-cart-checkout";
import {
  persistPortalCartToServer,
  readPortalCart,
  syncPortalCartWithServer,
  writePortalCart,
} from "@/lib/portal-cart";
import { fetchAuthMeShared } from "@/lib/auth-me-client";
import { ensureSignedInForPurchase } from "@/lib/purchase-auth";
import { sanitizeProductDetailBlocks } from "@/lib/sanitize-product-detail-blocks";
import { softwareCatalogHref } from "@/lib/software-catalog-links";
import type { ClientProfile } from "@/types/profile";
import type { OrderLineItem, PortalOrder, PurchaseType } from "@/types/orders";
import { AutodeskFreeTrialLink } from "@/components/shared/AutodeskFreeTrialLink";
import { ProductDetailBlocks } from "./ProductDetailBlocks";
import { ProductPurchaseOptions } from "./ProductPurchaseOptions";
import { RenewalSerialNumberField } from "./RenewalSerialNumberField";

type Duration = PortalOrder["duration"];

const DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "keyFeatures", label: "Key Features" },
  { id: "whatsIncluded", label: "What's Included" },
  { id: "subscriptionLicensing", label: "Subscription and Licensing Options" },
  { id: "priceDetails", label: "Price Details" },
] as const;

type DetailTabId = (typeof DETAIL_TABS)[number]["id"];

function featureBullets(productName: string): string[] {
  const lower = productName.toLowerCase();
  if (lower.includes("autocad") || lower.includes("revit") || lower.includes("civil")) {
    return ["2D & 3D design", "Industry toolsets", "Cloud collaboration", "Automation tools"];
  }
  if (lower.includes("adobe") || lower.includes("photoshop") || lower.includes("illustrator")) {
    return ["Creative workflows", "Cloud libraries", "Team collaboration", "Regular updates"];
  }
  if (lower.includes("microsoft") || lower.includes("365") || lower.includes("visio")) {
    return ["Business productivity", "Cloud sync", "Security & compliance", "Ongoing updates"];
  }
  return ["Licensed software", "Vendor support", "Updates included", "Aptus account management"];
}

function priceDetailBlocks(productName: string): ProductDetailBlock[] {
  const rows: Array<[string, string, string]> = [
    ["Commercial New", "Annual (12 months)", "new", "1year"],
    ["Commercial New", "3 Years (36 months)", "new", "3year"],
    ["Renewal Subscription", "Annual (12 months)", "renew", "1year"],
    ["Renewal Subscription", "3 Years (36 months)", "renew", "3year"],
  ].map(([license, term, purchaseType, duration]) => {
    const sku = lookupPortalSku(
      productName,
      duration as "1year" | "3year",
      purchaseType as "new" | "renew",
    );
    return [license, term, sku ? formatOmanAmount(sku.price) : "Quote on request"];
  });

  if (rows.every((row) => row[2] === "Quote on request")) {
    return [
      {
        type: "p",
        text: "Pricing for this product is available on request. Contact the Aptus sales team for a quotation.",
      },
    ];
  }

  return [
    {
      type: "p",
      text: "Prices are in Omani Rial (OMR) and exclude 5% VAT. Choose duration and license type in the buy card to match the price below.",
    },
    {
      type: "table",
      headers: ["License type", "Term", "Price"],
      rows,
    },
  ];
}

type ProductDetailPanelProps = {
  product: SoftwarePurchaseProduct;
  category: SoftwarePurchaseCategory;
};

export function ProductDetailPanel({ product, category }: ProductDetailPanelProps) {
  const { openQuote } = useQuoteModal();
  const productsHref = softwareCatalogHref(category.id);
  const purchasable = isPortalPurchasableProduct(product.href);
  const meta = getProductCardMeta(product, category.label);
  const imageSrc = getPurchaseProductImage(product.href);
  const config = useMemo(() => getProductConfig(product.name), [product.name]);
  const catalogTitle = useMemo(() => getProductCatalogTitle(product.href), [product.href]);
  const [user, setUser] = useState<ClientProfile | null>(null);
  const [duration, setDuration] = useState<Duration>("1year");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("new");
  const [packageId, setPackageId] = useState<string | undefined>(
    config.kind !== "bundle" ? config.packages?.[0]?.id : undefined,
  );
  const [levelId, setLevelId] = useState<string | undefined>(
    config.kind === "levels" ? config.levels[0]?.id : undefined,
  );
  const [quantity, setQuantity] = useState(1);
  const [serialNumber, setSerialNumber] = useState("");
  const [serialError, setSerialError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTabId>("overview");
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSerialNumber = config.kind === "renewal" && purchaseType === "renew";
  const draftItem: OrderLineItem = {
    category: category.label,
    productName: product.name,
    quantity,
    duration,
    purchaseType,
    packageId,
    levelId,
    ...(showSerialNumber && serialNumber.trim()
      ? { serialNumber: serialNumber.trim() }
      : {}),
  };
  const unit = cartLineUnitPrice(draftItem, duration);
  const bullets = featureBullets(product.name);
  const productSlug = productSlugFromHref(product.href);
  const detailContent = useMemo(
    () =>
      getProductDetailContent(product.name, {
        brandLabel: category.label,
        description: meta.description,
        slug: productSlug,
      }),
    [product.name, productSlug, category.label, meta.description],
  );
  const priceBlocks = useMemo(() => priceDetailBlocks(product.name), [product.name]);
  const activeBlocks = useMemo(() => {
    const raw = activeTab === "priceDetails" ? priceBlocks : detailContent[activeTab];
    return sanitizeProductDetailBlocks(raw ?? [], activeTab);
  }, [activeTab, detailContent, priceBlocks]);
  const hasActiveBlocks = Boolean(activeBlocks.length);

  useEffect(() => {
    let cancelled = false;
    async function hydrateCart() {
      const me = await fetchAuthMeShared();
      const loggedIn = me.ok ? me.user : null;
      if (cancelled) return;
      setUser(loggedIn);

      const cart = loggedIn ? await syncPortalCartWithServer() : readPortalCart();
      if (cancelled) return;
      const existing = cart.items.find(
        (item) =>
          item.category === category.label && item.productName === product.name,
      );
      if (existing) {
        if (existing.duration) setDuration(existing.duration);
        if (existing.purchaseType) setPurchaseType(existing.purchaseType);
        if (existing.packageId) setPackageId(existing.packageId);
        if (existing.levelId) setLevelId(existing.levelId);
        if (existing.serialNumber) setSerialNumber(existing.serialNumber);
      }
      setHydrated(true);
    }
    void hydrateCart();
    return () => {
      cancelled = true;
    };
  }, [category.label, product.name]);

  function handlePurchaseTypeChange(nextPurchaseType: PurchaseType) {
    setPurchaseType(nextPurchaseType);
    if (nextPurchaseType === "new") {
      setSerialNumber("");
      setSerialError(null);
    }
  }

  async function addToCart() {
    if (!purchasable) return;

    const signedIn = await ensureSignedInForPurchase(setMessage);
    if (!signedIn) return;

    if (showSerialNumber && !serialNumber.trim()) {
      setSerialError("Serial number is required for renewals.");
      setMessage(null);
      return;
    }
    setSerialError(null);

    const existing = readPortalCart();
    const key = `${category.label}::${product.name}`;
    const selections = Object.fromEntries(
      existing.items.map((item) => [
        `${item.category}::${item.productName}`,
        item,
      ]),
    );
    const prev = selections[key];
    const addQty = Math.min(999, Math.max(1, quantity));
    // Same product is one cart line — second Add must increment, not replace with the same qty.
    selections[key] = {
      ...draftItem,
      quantity: Math.min(999, (prev?.quantity ?? 0) + addQty),
    };
    const cart = {
      duration,
      items: Object.values(selections),
    };
    writePortalCart(cart);
    const me = await fetchAuthMeShared();
    if (me.ok) {
      setUser(me.user);
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      void persistPortalCartToServer(cart);
    }
    setQuantity(1);
    setSerialNumber("");
    setMessage(`${product.name} added to cart.`);
  }

  if (!hydrated) {
    return (
      <div className="aptus-product-detail__loading" role="status">
        Loading product…
      </div>
    );
  }

  return (
    <div className="aptus-product-detail">
      <Link href={productsHref} className="aptus-product-detail__back">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to products
      </Link>

      <nav className="aptus-product-detail__breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">›</span>
        <Link href="/software-solutions">Software</Link>
        <span aria-hidden="true">›</span>
        <Link href={productsHref}>{category.label}</Link>
        <span aria-hidden="true">›</span>
        <span className="is-current">{product.name}</span>
      </nav>

      {message ? (
        <p role="status" className="aptus-featured-cart__success">
          {message}
        </p>
      ) : null}

      <div className="aptus-product-detail__grid">
        <div className="aptus-product-detail__main">
          <div className="aptus-product-detail__hero">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt="" className="aptus-product-detail__hero-img" />
            ) : (
              <span className="aptus-product-detail__hero-icon" aria-hidden="true">
                {meta.initials}
              </span>
            )}
          </div>

          <div className="aptus-product-detail__tabs" role="tablist" aria-label="Product information">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "is-active" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="aptus-product-detail__tab-panel" role="tabpanel">
            {hasActiveBlocks ? (
              <ProductDetailBlocks blocks={activeBlocks!} />
            ) : activeTab === "overview" ? (
              <p>{meta.description}</p>
            ) : (
              <p>
                {DETAIL_TABS.find((tab) => tab.id === activeTab)?.label ?? "Product"} details for{" "}
                {product.name} are available from our sales team.{" "}
                <a href="mailto:info@aptusinfotech.com">Contact info@aptusinfotech.com</a> or call{" "}
                <a href="tel:+96899418481">+968 9941 8481</a>.
              </p>
            )}
          </div>

          <p className="aptus-product-detail__marketing-link">
            <Link href={product.href}>View full product page on aptusinfotech.com →</Link>
          </p>
        </div>

        <aside className="aptus-product-detail__sidebar">
          <div className="aptus-product-detail__buy-card">
            <div className="aptus-product-detail__buy-head">
              <span className="aptus-product-detail__vendor-icon" aria-hidden="true">
                {meta.initials}
              </span>
              <span className="aptus-product-detail__vendor">{category.label}</span>
              <span className="aptus-product-detail__badge">{meta.badge}</span>
            </div>

            <h2 className="aptus-product-detail__title">{product.name}</h2>
            {catalogTitle ? (
              <p className="aptus-product-detail__catalog-title">{catalogTitle}</p>
            ) : null}

            <p className="aptus-product-detail__summary">{meta.description}</p>

            <ul className="aptus-product-detail__features">
              {bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="aptus-product-detail__purchase">
              {purchasable ? (
                <>
                  <p className="aptus-product-detail__price">
                    {unit
                      ? config.kind === "renewal"
                        ? `${formatOmanAmount(unit)}/${duration === "3year" ? "3yr" : "year"}`
                        : formatOmanAmount(unit)
                      : "Quote on request"}
                  </p>
                </>
              ) : (
                <p className="aptus-product-detail__price">Quote on request</p>
              )}
              <p className="aptus-product-detail__price-note">
                {config.kind === "bundle"
                  ? "Single bundle · Perpetual or one-time license"
                  : config.kind === "levels"
                    ? `${config.levels.find((level) => level.id === levelId)?.label ?? config.levels[0]?.label ?? "Level 1"} · Select a level below`
                    : `${purchaseType === "renew" ? "Renewal" : "New Purchase"} · ${
                        duration === "3year" ? "3 Years" : "1 Year"
                      } · Select options below`}
              </p>

              <ProductPurchaseOptions
                className="aptus-product-detail__purchase-options"
                config={config}
                duration={duration}
                purchaseType={purchaseType}
                packageId={packageId}
                levelId={levelId}
                onDurationChange={setDuration}
                onPurchaseTypeChange={handlePurchaseTypeChange}
                onPackageChange={setPackageId}
                onLevelChange={setLevelId}
                packageLayout="cards"
              />

              {showSerialNumber ? (
                <RenewalSerialNumberField
                  id="product-serial-number"
                  value={serialNumber}
                  error={serialError}
                  onChange={(value) => {
                    setSerialNumber(value);
                    if (serialError) setSerialError(null);
                  }}
                />
              ) : null}

              {purchasable ? (
                <>
                  <div className="aptus-product-detail__qty">
                    <span>Quantity</span>
                    <div className="aptus-product-detail__qty-controls">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="aptus-product-detail__btn aptus-product-detail__btn--primary"
                    onClick={() => void addToCart()}
                  >
                    Add to Cart
                  </button>
                  {!user ? (
                    <p className="aptus-product-detail__sign-in-note">
                      Sign in to purchase — you will be redirected to sign in when adding to cart.
                    </p>
                  ) : null}
                  <AutodeskFreeTrialLink productHref={product.href} />
                </>
              ) : null}
              <button
                type="button"
                className="aptus-product-detail__btn aptus-product-detail__btn--outline"
                onClick={() =>
                  openQuote(
                    quoteContextForPortalProduct({
                      family: category.id === "elv-solutions" ? "elv" : category.id,
                      productName: product.name,
                      productHref: product.href,
                    }),
                  )
                }
              >
                Request Quote
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
