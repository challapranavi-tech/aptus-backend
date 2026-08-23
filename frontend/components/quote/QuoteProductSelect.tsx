"use client";

import { cn } from "@/lib/utils";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type QuoteProductSelectProps = {
  name?: string;
  label: string;
  products: string[];
  defaultValue?: string;
  /** Placeholder option label when nothing is selected. */
  placeholder?: string;
  className?: string;
};

/**
 * Custom select that opens downward (native <select> flips upward near the
 * viewport bottom). Menu is portaled + fixed so modal overflow does not clip it.
 */
export function QuoteProductSelect({
  name = "product",
  label,
  products,
  defaultValue = "Select Software Product",
  placeholder = "Select Software Product",
  className,
}: QuoteProductSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLLabelElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setValue(defaultValue);
    setOpen(false);
  }, [defaultValue, products, placeholder]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const place = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const maxH = Math.min(14 * 16, window.innerHeight * 0.4);
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(6 * 16, Math.min(maxH, spaceBelow)),
        zIndex: 1100,
      });
    };

    place();
    window.addEventListener("resize", place);
    // Modal body scrolls — keep menu pinned under the trigger.
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((target as Element).closest?.(".aptus-quote-product-menu")) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = [placeholder, ...products, "Others"];

  return (
    <label ref={rootRef} className={cn("aptus-form-label relative block", className)}>
      {label}
      <input type="hidden" name={name} value={value === placeholder ? placeholder : value} />
      <button
        ref={triggerRef}
        type="button"
        className="aptus-form-input aptus-quote-product-trigger mt-0 flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value === placeholder ? "text-black/45" : undefined}>{value}</span>
        <span aria-hidden="true" className="text-black/45">
          ▾
        </span>
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <ul id={listId} role="listbox" className="aptus-quote-product-menu" style={menuStyle}>
              {options.map((option) => (
                <li key={option} role="option" aria-selected={option === value}>
                  <button
                    type="button"
                    className={cn(
                      "aptus-quote-product-option",
                      option === value && "aptus-quote-product-option--active",
                    )}
                    onClick={() => {
                      setValue(option);
                      setOpen(false);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </label>
  );
}
