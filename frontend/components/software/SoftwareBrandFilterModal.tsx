"use client";

import { useEffect, useRef } from "react";
import type { SoftwarePurchaseCategory } from "@/lib/order-pricing";

interface SoftwareBrandFilterModalProps {
  open: boolean;
  brands: SoftwarePurchaseCategory[];
  activeBrandId: string;
  onClose: () => void;
  onSelect: (brandId: string) => void;
}

export function SoftwareBrandFilterModal({
  open,
  brands,
  activeBrandId,
  onClose,
  onSelect,
}: SoftwareBrandFilterModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

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

  function handleSelect(brandId: string) {
    onSelect(brandId);
    onClose();
  }

  return (
    <div className="aptus-brand-filter-overlay" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
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

        <p className="aptus-brand-filter-modal__hint">Scroll to browse all brands</p>

        <div className="aptus-brand-filter-modal__scroll" role="listbox" aria-label="Software brands">
          <button
            type="button"
            role="option"
            aria-selected={activeBrandId === "all"}
            className={`aptus-brand-filter-chip${activeBrandId === "all" ? " is-active" : ""}`}
            onClick={() => handleSelect("all")}
          >
            All brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              role="option"
              aria-selected={activeBrandId === brand.id}
              className={`aptus-brand-filter-chip${activeBrandId === brand.id ? " is-active" : ""}`}
              onClick={() => handleSelect(brand.id)}
            >
              {brand.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
