"use client";

import { useEffect, useId, useRef } from "react";
import type { SoftwarePurchaseCategory } from "@/lib/order-pricing";

interface SoftwareBrandFilterDropdownProps {
  open: boolean;
  brands: SoftwarePurchaseCategory[];
  selectedBrandIds: string[];
  activeLabel: string;
  onOpenChange: (open: boolean) => void;
  onChange: (brandIds: string[]) => void;
}

export function SoftwareBrandFilterDropdown({
  open,
  brands,
  selectedBrandIds,
  activeLabel,
  onOpenChange,
  onChange,
}: SoftwareBrandFilterDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const allSelected = selectedBrandIds.length === 0;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onOpenChange]);

  function toggleAll(checked: boolean) {
    onChange(checked ? [] : brands.map((brand) => brand.id));
  }

  function toggleBrand(brandId: string) {
    if (allSelected) {
      onChange([brandId]);
      return;
    }
    onChange(
      selectedBrandIds.includes(brandId)
        ? selectedBrandIds.filter((id) => id !== brandId)
        : [...selectedBrandIds, brandId],
    );
  }

  return (
    <div className="aptus-brand-filter" ref={rootRef}>
      <button
        type="button"
        className={`aptus-brand-filter-tile${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => onOpenChange(!open)}
      >
        <span className="aptus-brand-filter-tile__label">Brand</span>
        <span className="aptus-brand-filter-tile__value">{activeLabel}</span>
      </button>

      {open ? (
        <div
          id={listId}
          className="aptus-brand-filter__panel"
          role="listbox"
          aria-label="Filter by brand"
          aria-multiselectable="true"
        >
          <label className="aptus-brand-filter-option">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => toggleAll(event.target.checked)}
            />
            <span>All brands</span>
          </label>

          {brands.map((brand) => (
            <label key={brand.id} className="aptus-brand-filter-option">
              <input
                type="checkbox"
                checked={allSelected || selectedBrandIds.includes(brand.id)}
                onChange={() => toggleBrand(brand.id)}
              />
              <span>{brand.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
