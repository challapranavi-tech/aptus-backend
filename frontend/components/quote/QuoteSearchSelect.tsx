"use client";

import { cn } from "@/lib/utils";
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

type QuoteSearchSelectProps = {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
};

/**
 * Searchable single-select used by Request Quote (Profession, etc.).
 * Menu is portaled + fixed so modal overflow does not clip it.
 */
export function QuoteSearchSelect({
  name,
  label,
  options,
  defaultValue,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  error,
  className,
  onValueChange,
}: QuoteSearchSelectProps) {
  const listId = useId();
  const searchId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue ?? placeholder);
  const [query, setQuery] = useState("");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  // Join options — a fresh array reference must not wipe the selected value.
  const optionsKey = options.join("\0");
  useEffect(() => {
    setValue(defaultValue ?? placeholder);
    setOpen(false);
    setQuery("");
  }, [defaultValue, placeholder, optionsKey]);

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
        maxHeight: Math.max(8 * 16, Math.min(maxH, spaceBelow)),
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
  }, [open]);

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
    if (!q) return [...options];
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  const submittedValue = value === placeholder ? "" : value;

  return (
    <div ref={rootRef} className={cn("aptus-form-label relative block", className)}>
      {label}
      <input type="hidden" name={name} value={submittedValue} />
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
        aria-invalid={error ? true : undefined}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
      >
        <span className={value === placeholder ? "text-black/45" : undefined}>{value}</span>
        <span aria-hidden="true" className="text-black/45">
          ▾
        </span>
      </button>
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
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  aria-label={searchPlaceholder}
                  className="aptus-form-input mt-0 w-full px-3 py-2 text-sm"
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <ul id={listId} role="listbox" className="aptus-quote-search-menu__list">
                {filtered.length === 0 ? (
                  <li className="aptus-quote-product-option text-black/45">No matches</li>
                ) : (
                  filtered.map((option) => (
                    <li key={option} role="option" aria-selected={option === value}>
                      <button
                        type="button"
                        className={cn(
                          "aptus-quote-product-option",
                          option === value && "aptus-quote-product-option--active",
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setValue(option);
                          setOpen(false);
                          setQuery("");
                          onValueChange?.(option);
                        }}
                      >
                        {option}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}