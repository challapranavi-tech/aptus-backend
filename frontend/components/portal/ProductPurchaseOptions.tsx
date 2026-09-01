import type { ProductConfig } from "@/data/product-options";
import type { PortalOrder, PurchaseType } from "@/types/orders";

type Duration = PortalOrder["duration"];

type OptionCard = {
  value: string;
  label: string;
};

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
  /** "cards" renders all options as selectable buttons (product detail page). */
  packageLayout?: "select" | "cards";
};

function OptionCardGroup({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  fullWidth = false,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  options: OptionCard[];
  onChange: (value: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={
        "aptus-product-options__field aptus-product-options__field--cards" +
        (fullWidth ? " aptus-product-options__field--full" : "")
      }
    >
      <span>{label}</span>
      <div className="aptus-product-options__option-cards" role="group" aria-label={ariaLabel}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              "aptus-product-options__option-card" +
              (option.value === value ? " is-active" : "")
            }
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionSelect({
  label,
  ariaLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  options: OptionCard[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="aptus-product-options__field">
      <span>{label}</span>
      <select value={value} aria-label={ariaLabel} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

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
  const useCardLayout = packageLayout === "cards";

  if (config.kind === "bundle") {
    if (!useCardLayout) return null;
    return (
      <div className={["aptus-product-options", className].filter(Boolean).join(" ")}>
        <OptionCardGroup
          label="License"
          ariaLabel="License type"
          value="bundle"
          options={[{ value: "bundle", label: "Single Bundle" }]}
          onChange={() => undefined}
          fullWidth
        />
      </div>
    );
  }

  const packages = config.kind === "renewal" || config.kind === "levels" ? config.packages : undefined;
  const resolvedPackageId = packageId ?? packages?.[0]?.id;
  const resolvedLevelId =
    levelId ?? (config.kind === "levels" ? config.levels[0]?.id : undefined);

  const durationOptions: OptionCard[] = [
    { value: "1year", label: compact ? "1 Year" : "1 Year" },
    { value: "3year", label: compact ? "3 Years" : "3 Years" },
  ];
  const licenseOptions: OptionCard[] = [
    { value: "new", label: compact ? "New" : "New Purchase" },
    { value: "renew", label: compact ? "Renewal" : "Renewal" },
  ];

  return (
    <div className={["aptus-product-options", className].filter(Boolean).join(" ")}>
      {packages?.length ? (
        useCardLayout ? (
          <OptionCardGroup
            label="Package"
            ariaLabel="Package"
            value={resolvedPackageId ?? packages[0]!.id}
            options={packages.map((option) => ({ value: option.id, label: option.label }))}
            onChange={onPackageChange}
            fullWidth
          />
        ) : (
          <OptionSelect
            label="Package"
            ariaLabel="Package"
            value={resolvedPackageId ?? packages[0]!.id}
            options={packages.map((option) => ({ value: option.id, label: option.label }))}
            onChange={onPackageChange}
          />
        )
      ) : null}

      {config.kind === "levels" ? (
        useCardLayout ? (
          <OptionCardGroup
            label="Level"
            ariaLabel="Level"
            value={resolvedLevelId ?? config.levels[0]!.id}
            options={config.levels.map((option) => ({ value: option.id, label: option.label }))}
            onChange={onLevelChange}
            fullWidth
          />
        ) : (
          <OptionSelect
            label="Level"
            ariaLabel="Level"
            value={resolvedLevelId ?? config.levels[0]!.id}
            options={config.levels.map((option) => ({ value: option.id, label: option.label }))}
            onChange={onLevelChange}
          />
        )
      ) : (
        <>
          {useCardLayout ? (
            <>
              <OptionCardGroup
                label={compact ? "Duration" : "Subscription Duration"}
                ariaLabel="Subscription duration"
                value={duration}
                options={durationOptions}
                onChange={(value) => onDurationChange(value as Duration)}
              />
              <OptionCardGroup
                label={compact ? "Type" : "License Type"}
                ariaLabel="License type"
                value={purchaseType}
                options={licenseOptions}
                onChange={(value) => onPurchaseTypeChange(value as PurchaseType)}
              />
            </>
          ) : (
            <>
              <OptionSelect
                label={compact ? "Duration" : "Subscription Duration"}
                ariaLabel="Subscription duration"
                value={duration}
                options={durationOptions}
                onChange={(value) => onDurationChange(value as Duration)}
              />
              <OptionSelect
                label={compact ? "Type" : "License Type"}
                ariaLabel="License type"
                value={purchaseType}
                options={licenseOptions}
                onChange={(value) => onPurchaseTypeChange(value as PurchaseType)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
