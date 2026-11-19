"use client";

import { useEffect, useId, useRef } from "react";

export type CatalogFilterOption = {
  id: string;
  label: string;
};

interface SoftwareBrandFilterDropdownProps {
  open: boolean;
  options: CatalogFilterOption[];
  /** null = all options; [] = none; non-empty = specific selection */
  selectedIds: string[] | null;
  activeLabel: string;
  fieldLabel: string;
  allLabel: string;
  menuLabel: string;
  /** Brand and product option labels stay in English when the page is Arabic. */
  keepLabels?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (ids: string[] | null) => void;
}

export function SoftwareBrandFilterDropdown({
  open,
  options,
  selectedIds,
  activeLabel,
  fieldLabel,
  allLabel,
  menuLabel,
  keepLabels = false,
  onOpenChange,
  onChange,
}: SoftwareBrandFilterDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const allSelected = selectedIds === null;
  const noneSelected = selectedIds !== null && selectedIds.length === 0;
  const valueIsName =
    keepLabels &&
    selectedIds?.length === 1 &&
    options.some((option) => option.label === activeLabel);

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
    onChange(checked ? null : []);
  }

  function toggleOption(optionId: string) {
    if (allSelected) {
      onChange(options.map((option) => option.id).filter((id) => id !== optionId));
      return;
    }
    if (noneSelected) {
      onChange([optionId]);
      return;
    }
    const next = selectedIds.includes(optionId)
      ? selectedIds.filter((id) => id !== optionId)
      : [...selectedIds, optionId];
    onChange(next.length === options.length ? null : next);
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
        <span className="aptus-brand-filter-tile__label">{fieldLabel}</span>
        <span
          className="aptus-brand-filter-tile__value"
          {...(valueIsName ? { "data-no-translate": "" } : {})}
        >
          {activeLabel}
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          className="aptus-brand-filter__panel"
          role="listbox"
          aria-label={menuLabel}
          aria-multiselectable="true"
        >
          <label className="aptus-brand-filter-option">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => toggleAll(event.target.checked)}
            />
            <span>{allLabel}</span>
          </label>

          {options.map((option) => (
            <label key={option.id} className="aptus-brand-filter-option">
              <input
                type="checkbox"
                checked={allSelected || (selectedIds?.includes(option.id) ?? false)}
                onChange={() => toggleOption(option.id)}
              />
              <span {...(keepLabels ? { "data-no-translate": "" } : {})}>{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
