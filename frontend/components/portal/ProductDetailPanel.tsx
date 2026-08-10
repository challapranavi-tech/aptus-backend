"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { getProductConfig } from "@/data/product-options";
import { getProductDetailContent } from "@/data/product-detail-content";
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
import type { OrderLineItem, PortalOrder, PurchaseType } from "@/types/orders";
import { ProductDetailBlocks } from "./ProductDetailBlocks";
import { ProductPurchaseOptions } from "./ProductPurchaseOptions";

type Duration = PortalOrder["duration"];

const DETAIL_TABS = ["Overview", "Features", "Specifications"] as const;

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

type ProductDetailPanelProps = {
  product: SoftwarePurchaseProduct;
  category: SoftwarePurchaseCategory;
};

export function ProductDetailPanel({ product, category }: ProductDetailPanelProps) {
  const router = useRouter();
  const { user, ready: authReady } = useAuth();
  const meta = getProductCardMeta(product, category.label);
  const imageSrc = getPurchaseProductImage(product.href);
  const config = useMemo(() => getProductConfig(product.name), [product.name]);
  const [duration, setDuration] = useState<Duration>("1year");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("new");
  const [packageId, setPackageId] = useState<string | undefined>(
    config.kind !== "bundle" ? config.packages?.[0]?.id : undefined,
  );
  const [levelId, setLevelId] = useState<string | undefined>(
    config.kind === "levels" ? config.levels[0]?.id : undefined,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof DETAIL_TABS)[number]>("Overview");
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draftItem: OrderLineItem = {
    category: category.label,
    productName: product.name,
    quantity,
    duration,
    purchaseType,
    packageId,
    levelId,
  };
  const unit = cartLineUnitPrice(draftItem, duration);
  const bullets = featureBullets(product.name);
  const detailContent = useMemo(() => getProductDetailContent(product.name), [product.name]);
  const activeBlocks =
    activeTab === "Overview"
      ? detailContent?.overview
      : activeTab === "Features"
        ? detailContent?.features
        : detailContent?.specifications;
  const hasActiveBlocks = Boolean(activeBlocks?.length);

  useEffect(() => {
    let cancelled = false;
    async function hydrateCart() {
      const cart = user ? await syncPortalCartWithServer() : readPortalCart();
      if (cancelled) return;
      const existing = cart.items.find(
        (item) =>
          item.category === category.label && item.productName === product.name,
      );
      if (existing) {
        // Quantity on this page is "amount to add", not cart total — leave at 1.
        if (existing.duration) setDuration(existing.duration);
        if (existing.purchaseType) setPurchaseType(existing.purchaseType);
        if (existing.packageId) setPackageId(existing.packageId);
        if (existing.levelId) setLevelId(existing.levelId);
      }
      setHydrated(true);
    }
    if (!authReady) return;
    void hydrateCart();
    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id, category.label, product.name]);

  function addToCart() {
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
    if (user) {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      void persistPortalCartToServer(cart);
    }
    setQuantity(1);
    setMessage(`${product.name} added to cart.`);
  }

  if (!hydrated && authReady) {
    return (
      <div className="aptus-product-detail__loading" role="status">
        Loading product…
      </div>
    );
  }

  return (
    <div className="aptus-product-detail">
      <button
        type="button"
        className="aptus-product-detail__back"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.push("/portal/products");
          }
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to products
      </button>

      <nav className="aptus-product-detail__breadcrumb" aria-label="Breadcrumb">
        <Link href="/portal/dashboard">Home</Link>
        <span aria-hidden="true">›</span>
        <Link href="/portal/products">Products</Link>
        <span aria-hidden="true">›</span>
        <span>{category.label}</span>
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
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={activeTab === tab ? "is-active" : undefined}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="aptus-product-detail__tab-panel" role="tabpanel">
            {hasActiveBlocks ? (
              <ProductDetailBlocks blocks={activeBlocks!} />
            ) : activeTab === "Overview" ? (
              <p>{meta.description}</p>
            ) : (
              <p>
                {activeTab} details for {product.name} are available from our sales team.{" "}
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

            <p className="aptus-product-detail__summary">{meta.description}</p>

            <ul className="aptus-product-detail__features">
              {bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="aptus-product-detail__purchase">
              <p className="aptus-product-detail__price">
                {unit
                  ? config.kind === "renewal"
                    ? `${formatOmanAmount(unit)}/${duration === "3year" ? "3yr" : "year"}`
                    : formatOmanAmount(unit)
                  : "Quote on request"}
              </p>
              <p className="aptus-product-detail__price-note">
                {config.kind === "bundle"
                  ? "One-time bundle price · Includes support & updates"
                  : config.kind === "levels"
                    ? `${config.levels.find((level) => level.id === levelId)?.label ?? config.levels[0]?.label ?? "Level 1"} · Includes support & updates`
                    : duration === "3year"
                      ? "3 Years subscription · Includes support & updates"
                      : "Annual subscription · Includes support & updates"}
              </p>

              <ProductPurchaseOptions
                className="aptus-product-detail__purchase-options"
                config={config}
                duration={duration}
                purchaseType={purchaseType}
                packageId={packageId}
                levelId={levelId}
                onDurationChange={setDuration}
                onPurchaseTypeChange={setPurchaseType}
                onPackageChange={setPackageId}
                onLevelChange={setLevelId}
                packageLayout="cards"
              />

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
                onClick={() => addToCart()}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
