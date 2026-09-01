"use client";

import { useEffect, useState } from "react";
import type { SoftwarePurchaseCategory } from "@/lib/order-pricing";

interface SoftwareBrandFilterModalProps {
  open: boolean;
  brands: SoftwarePurchaseCategory[];
  selectedBrandIds: string[];
  onClose: () => void;
  onApply: (brandIds: string[]) => void;
}

export function SoftwareBrandFilterModal({
  open,
  brands,
  selectedBrandIds,
  onClose,
  onApply,
}: SoftwareBrandFilterModalProps) {
  const [draftIds, setDraftIds] = useState<string[]>(selectedBrandIds);

  useEffect(() => {
    if (!open) return;
    setDraftIds(selectedBrandIds);
  }, [open, selectedBrandIds]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const allSelected = draftIds.length === 0;

  function toggleBrand(brandId: string) {
    setDraftIds((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId],
    );
  }

  function toggleAll(checked: boolean) {
    setDraftIds(checked ? [] : brands.map((brand) => brand.id));
  }

  function handleApply() {
    onApply(draftIds);
    onClose();
  }

  return (
    <div className="aptus-brand-filter-overlay" onClick={onClose} role="presentation">
      <div
        className="aptus-brand-filter-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-filter-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="aptus-brand-filter-modal__header">
          <h2 id="brand-filter-title" className="aptus-brand-filter-modal__title">
            Filter by brand
          </h2>
          <button type="button" className="aptus-brand-filter-modal__close" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="aptus-brand-filter-modal__hint">Select one or more brands, or leave all checked for the full catalog.</p>

        <div className="aptus-brand-filter-modal__list" role="group" aria-label="Software brands">
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
                checked={allSelected || draftIds.includes(brand.id)}
                onChange={() => {
                  if (allSelected) {
                    setDraftIds([brand.id]);
                    return;
                  }
                  toggleBrand(brand.id);
                }}
              />
              <span>{brand.label}</span>
            </label>
          ))}
        </div>

        <div className="aptus-brand-filter-modal__actions">
          <button
            type="button"
            className="aptus-brand-filter-modal__btn aptus-brand-filter-modal__btn--ghost"
            onClick={() => setDraftIds([])}
          >
            Clear all
          </button>
          <button type="button" className="aptus-brand-filter-modal__btn" onClick={handleApply}>
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
