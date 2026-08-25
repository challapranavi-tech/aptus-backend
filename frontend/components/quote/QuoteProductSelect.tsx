"use client";

import { cn } from "@/lib/utils";
import { PRODUCT_PLACEHOLDER } from "@shared/lib/contact-request";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

type QuoteProductSelectProps = {
  name?: string;
  label: string;
  products: string[];
  /** Prefill selection(s) when opening from a product page. */
  defaultSelected?: string[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  onChange?: (selected: string[]) => void;
};

/**
 * Multi-select product picker with search. Menu is portaled so modal overflow
 * does not clip it. Values are submitted as a single comma-separated `product` field.
 *
 * Parent should remount (key) when defaultSelected / product list context changes.
 */
export function QuoteProductSelect({
  name = "product",
  label,
  products,
  defaultSelected = [],
  placeholder = PRODUCT_PLACEHOLDER,
  className,
  error,
  onChange,
}: QuoteProductSelectProps) {
  const listId = useId();
  const searchId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(() =>
    defaultSelected.filter((p) => products.includes(p) || p === "Others"),
  );
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const options = useMemo(() => [...products, "Others"], [products]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const place = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const maxH = Math.min(18 * 16, window.innerHeight * 0.5);
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(8 * 16, Math.min(maxH, Math.max(spaceBelow, 8 * 16))),
        zIndex: 1100,
      });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, selected.length]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    // ponytail: pointerdown + menuRef (not class closest) — class checks failed when
    // the portaled node re-rendered mid-click and the menu briefly unmounted.
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(option: string, source: "menu" | "chip" = "menu") {
    setSelected((prev) => {
      if (prev.includes(option)) {
        // Menu click on an already-selected item must keep it — ELV pages
        // pre-select the current product; clicking it again was clearing the chip.
        if (source === "menu") return prev;
        const next = prev.filter((p) => p !== option);
        onChange?.(next);
        return next;
      }
      const next = [...prev, option];
      onChange?.(next);
      return next;
    });
  }

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected[0]} +${selected.length - 1} more`;

  return (
    <div ref={rootRef} className={cn("aptus-form-label relative block", className)}>
      {label}
      <input type="hidden" name={name} value={selected.join(", ")} />
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "aptus-form-input aptus-quote-product-trigger mt-0 flex w-full items-center justify-between gap-2 px-4 py-3 text-left",
          error && "aptus-form-input--error",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-multiselectable="true"
        aria-invalid={error ? true : undefined}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
      >
        <span className={selected.length === 0 ? "text-black/45" : undefined}>
          {triggerLabel}
        </span>
        <span aria-hidden="true" className="text-black/45">
          ▾
        </span>
      </button>

      {selected.length > 0 && (
        <ul className="aptus-quote-product-chips mt-2">
          {selected.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="aptus-quote-product-chip"
                onClick={() => toggle(item, "chip")}
                aria-label={`Remove ${item}`}
              >
                {item}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="aptus-quote-product-menu aptus-quote-search-menu"
              style={menuStyle}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="aptus-quote-search-menu__search">
                <input
                  ref={searchRef}
                  id={searchId}
                  type="search"
                  value={query}
                  placeholder="Search products…"
                  autoComplete="off"
                  aria-label="Search products"
                  className="aptus-form-input mt-0 w-full px-3 py-2 text-sm"
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <ul
                id={listId}
                role="listbox"
                aria-multiselectable="true"
                className="aptus-quote-search-menu__list"
              >
                {filtered.length === 0 ? (
                  <li className="aptus-quote-product-option text-black/45">No matches</li>
                ) : (
                  filtered.map((option) => {
                    const active = selected.includes(option);
                    return (
                      <li key={option} role="option" aria-selected={active}>
                        <button
                          type="button"
                          className={cn(
                            "aptus-quote-product-option aptus-quote-product-option--multi",
                            active && "aptus-quote-product-option--active",
                          )}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggle(option, "menu")}
                        >
                          <span
                            className={cn(
                              "aptus-quote-product-check",
                              active && "aptus-quote-product-check--on",
                            )}
                            aria-hidden="true"
                          >
                            {active ? "✓" : ""}
                          </span>
                          <span>{option}</span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
              <div className="aptus-quote-search-menu__footer">
                <button
                  type="button"
                  className="aptus-quote-product-done"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  Done
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
