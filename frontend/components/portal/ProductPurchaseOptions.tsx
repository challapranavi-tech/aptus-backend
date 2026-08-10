import type { ProductConfig } from "@/data/product-options";
import type { PortalOrder, PurchaseType } from "@/types/orders";

type Duration = PortalOrder["duration"];

type ProductPurchaseOptionsProps = {
  /** Which selectors to render — driven entirely by the product's data-driven configuration. */
  config: ProductConfig;
  duration: Duration;
  purchaseType: PurchaseType;
  packageId?: string;
  levelId?: string;
  onDurationChange: (duration: Duration) => void;
  onPurchaseTypeChange: (purchaseType: PurchaseType) => void;
  onPackageChange: (packageId: string) => void;
  onLevelChange: (levelId: string) => void;
  className?: string;
  /** Shorter labels for tight layouts (cart table). */
  compact?: boolean;
  /** "cards" renders Package as selectable buttons (product detail page); "select" keeps the compact dropdown (cart table). */
  packageLayout?: "select" | "cards";
};

export function ProductPurchaseOptions({
  config,
  duration,
  purchaseType,
  packageId,
  levelId,
  onDurationChange,
  onPurchaseTypeChange,
  onPackageChange,
  onLevelChange,
  className,
  compact = false,
  packageLayout = "select",
}: ProductPurchaseOptionsProps) {
  // Single Bundle products: no selectors at all — quantity only (rendered by the caller).
  if (config.kind === "bundle") return null;

  const packages = config.kind === "renewal" || config.kind === "levels" ? config.packages : undefined;
  const resolvedPackageId = packageId ?? packages?.[0]?.id;
  // Card layout is scoped to Software with Renewals products only (per product spec);
  // a Levels product with an (unusual) configured package still falls back to the dropdown.
  const useCardLayout = packageLayout === "cards" && config.kind === "renewal";

  return (
    <div className={["aptus-product-options", className].filter(Boolean).join(" ")}>
      {packages?.length ? (
        useCardLayout ? (
          <div className="aptus-product-options__field aptus-product-options__field--package">
            <span>Package</span>
            <div className="aptus-product-options__package-cards" role="group" aria-label="Package">
              {packages.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={
                    "aptus-product-options__package-card" +
                    (option.id === resolvedPackageId ? " is-active" : "")
                  }
                  aria-pressed={option.id === resolvedPackageId}
                  onClick={() => onPackageChange(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <label className="aptus-product-options__field">
            <span>Package</span>
            <select
              value={resolvedPackageId}
              aria-label="Package"
              onChange={(event) => onPackageChange(event.target.value)}
            >
              {packages.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )
      ) : null}

      {config.kind === "levels" ? (
        <label className="aptus-product-options__field">
          <span>Level</span>
          <select
            value={levelId ?? config.levels[0]?.id}
            aria-label="Level"
            onChange={(event) => onLevelChange(event.target.value)}
          >
            {config.levels.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="aptus-product-options__field">
            <span>{compact ? "Duration" : "Subscription Duration"}</span>
            <select
              value={duration}
              aria-label="Subscription duration"
              onChange={(event) => onDurationChange(event.target.value as Duration)}
            >
              <option value="1year">Annual</option>
              <option value="3year">3 Years</option>
            </select>
          </label>
          <label className="aptus-product-options__field">
            <span>{compact ? "Type" : "License Type"}</span>
            <select
              value={purchaseType}
              aria-label="License type"
              onChange={(event) => onPurchaseTypeChange(event.target.value as PurchaseType)}
            >
              <option value="new">{compact ? "New" : "New Purchase"}</option>
              <option value="renew">{compact ? "Renew" : "Renew"}</option>
            </select>
          </label>
        </>
      )}
    </div>
  );
}
