"use client";

import { SOFTWARE_BRAND_LOGO_ITEMS } from "@/data/software-brand-logos";
import { softwareCatalogHref } from "@/lib/software-catalog-links";
import Link from "next/link";
import { useMemo, useState } from "react";

function brandInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

export function SoftwareBrandsExplorer() {
  const brands = SOFTWARE_BRAND_LOGO_ITEMS;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [brokenLogos, setBrokenLogos] = useState<Record<string, true>>({});

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const catalogHref =
    selectedIds.length > 0 ? softwareCatalogHref(selectedIds) : softwareCatalogHref();

  function toggleBrand(brandId: string) {
    setSelectedIds((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId],
    );
  }

  function selectAll() {
    setSelectedIds(brands.map((brand) => brand.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  return (
    <section className="aptus-software-brands" aria-labelledby="software-brands-heading">
      <div className="aptus-software-brands__inner">
        <header className="aptus-software-brands__header">
          <div className="aptus-software-brands__intro">
            <h1 id="software-brands-heading" className="aptus-software-brands__title">
              Explore by brand
            </h1>
            <p className="aptus-software-brands__subtitle">
              Select one or more brands, then open the catalogue with those filters applied.
            </p>
          </div>
          <div className="aptus-software-brands__toolbar">
            <button type="button" className="aptus-software-brands__ghost" onClick={selectAll}>
              Select all
            </button>
            <button
              type="button"
              className="aptus-software-brands__ghost"
              onClick={clearSelection}
              disabled={selectedIds.length === 0}
            >
              Clear
            </button>
            <Link href={catalogHref} className="aptus-software-brands__cta">
              {selectedIds.length > 0
                ? `View products (${selectedIds.length})`
                : "View all products"}
            </Link>
          </div>
        </header>

        <div
          className="aptus-software-brands__grid"
          role="group"
          aria-label="Software brands"
        >
          {brands.map((brand) => {
            const selected = selectedSet.has(brand.id);
            const showLogo = Boolean(brand.logoSrc) && !brokenLogos[brand.id];
            return (
              <button
                key={brand.id}
                type="button"
                className={`aptus-software-brands__tile${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => toggleBrand(brand.id)}
              >
                <span className="aptus-software-brands__logo" aria-hidden>
                  {showLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logoSrc!}
                      alt=""
                      loading="eager"
                      decoding="async"
                      onError={() =>
                        setBrokenLogos((prev) => ({ ...prev, [brand.id]: true }))
                      }
                    />
                  ) : (
                    <span className="aptus-software-brands__initials">
                      {brandInitials(brand.label)}
                    </span>
                  )}
                </span>
                <span className="aptus-software-brands__name">{brand.label}</span>
                <span className="aptus-software-brands__check" aria-hidden>
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
