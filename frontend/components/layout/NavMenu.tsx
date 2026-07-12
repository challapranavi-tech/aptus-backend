"use client";

import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface NavMenuProps {
  items: NavigationItem[];
}

const VIEWPORT_PAD = 12;

/** Match SmartMenus collision behavior — flip/shift flyouts inside the viewport. */
function positionFlyout(dropdown: HTMLElement) {
  const panel = dropdown.querySelector<HTMLElement>(":scope > .aptus-masthead__dropdown-panel");
  if (!panel) return;

  panel.classList.remove("is-flip-x");
  panel.style.removeProperty("top");
  panel.style.removeProperty("bottom");

  const nested = dropdown.classList.contains("aptus-masthead__dropdown--nested");
  let rect = panel.getBoundingClientRect();

  if (rect.right > window.innerWidth - VIEWPORT_PAD) {
    panel.classList.add("is-flip-x");
    rect = panel.getBoundingClientRect();
  }

  if (rect.left < VIEWPORT_PAD) {
    panel.classList.remove("is-flip-x");
    rect = panel.getBoundingClientRect();
  }

  if (rect.bottom > window.innerHeight - VIEWPORT_PAD) {
    const overflow = rect.bottom - (window.innerHeight - VIEWPORT_PAD);
    if (nested) {
      panel.style.top = `${Math.max(-dropdown.offsetTop, -overflow)}px`;
    }
  }
}

function scheduleFlyoutPosition(dropdown: HTMLElement) {
  requestAnimationFrame(() => positionFlyout(dropdown));
}

function onFlyoutPointer(event: { currentTarget: HTMLLIElement }) {
  let dropdown: HTMLElement | null = event.currentTarget;
  while (dropdown) {
    if (dropdown.classList.contains("aptus-masthead__dropdown")) {
      scheduleFlyoutPosition(dropdown);
    }
    const parentItem: HTMLElement | null =
      dropdown.parentElement?.closest<HTMLElement>(".aptus-masthead__dropdown") ?? null;
    dropdown = parentItem;
  }
}

function NavChevron({ direction = "down" }: { direction?: "down" | "right" }) {
  if (direction === "right") {
    return (
      <svg
        className="aptus-masthead__chevron aptus-masthead__chevron--right"
        viewBox="0 0 256 512"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M64 448c-8.2 0-16.4-3.1-22.6-9.4s-12.5-32.8 0-45.3L178.7 256 41.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3l-160 160c-6.2 6.2-14.4 9.4-22.6 9.4z"
        />
      </svg>
    );
  }
  return (
    <svg className="aptus-masthead__chevron" viewBox="0 0 320 512" aria-hidden>
      <path
        fill="currentColor"
        d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"
      />
    </svg>
  );
}

function isDirectlyActive(item: NavigationItem, pathname: string): boolean {
  if (!item.href || item.href === "#") return false;
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isItemActive(item: NavigationItem, pathname: string): boolean {
  if (isDirectlyActive(item, pathname)) return true;
  return (item.children ?? []).some((child) => isItemActive(child, pathname));
}

function NavDropdownItem({
  item,
  onClose,
  nested = false,
  menuVariant,
  pathname,
}: {
  item: NavigationItem;
  onClose?: () => void;
  nested?: boolean;
  menuVariant?: "software";
  pathname: string;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const linkClass = nested
    ? "aptus-masthead__link aptus-masthead__link--nested"
    : "aptus-masthead__link";
  const chevronDirection = menuVariant === "software" ? "right" : "down";
  const active = isDirectlyActive(item, pathname);

  if (hasChildren) {
    return (
      <li
        className="aptus-masthead__dropdown aptus-masthead__dropdown--nested"
        onMouseEnter={onFlyoutPointer}
        onFocusCapture={onFlyoutPointer}
      >
        {item.href ? (
          <Link
            href={item.href}
            className={`${linkClass} aptus-masthead__link--parent${active ? " is-active" : ""}`}
            onClick={onClose}
          >
            {item.label}
            <NavChevron direction={chevronDirection} />
          </Link>
        ) : (
          <span className={`${linkClass} aptus-masthead__link--parent aptus-masthead__link--flyout-trigger`}>
            {item.label}
            <NavChevron direction={chevronDirection} />
          </span>
        )}
        <ul className="aptus-masthead__dropdown-panel aptus-masthead__dropdown-panel--nested">
          {item.children!.map((child) => (
            <NavDropdownItem
              key={child.label}
              item={child}
              onClose={onClose}
              nested
              menuVariant={menuVariant}
              pathname={pathname}
            />
          ))}
        </ul>
      </li>
    );
  }

  if (!item.href) return null;

  return (
    <li>
      <Link href={item.href} className={`${linkClass}${active ? " is-active" : ""}`} onClick={onClose}>
        {item.label}
      </Link>
    </li>
  );
}

function DropdownItem({
  item,
  pathname,
  onClose,
}: {
  item: NavigationItem;
  pathname: string;
  onClose?: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const active = isDirectlyActive(item, pathname);
  const isSoftware = item.label === "Software";
  const isElv = item.label === "ELV Solutions";

  if (!hasChildren) {
    if (!item.href) return null;
    return (
      <li>
        <Link
          href={item.href}
          className={cn("aptus-masthead__link", active && "is-active")}
          onClick={onClose}
        >
          {item.label}
        </Link>
      </li>
    );
  }

  const panelClass = cn(
    "aptus-masthead__dropdown-panel",
    (isElv || isSoftware) && "aptus-masthead__dropdown-panel--wide",
    isSoftware && "aptus-masthead__dropdown-panel--software",
  );

  return (
    <li
      className="aptus-masthead__dropdown"
      onMouseEnter={onFlyoutPointer}
      onFocusCapture={onFlyoutPointer}
    >
      <Link
        href={item.href ?? "#"}
        className={cn("aptus-masthead__link", active && "is-active")}
        onClick={onClose}
      >
        {item.label}
        <NavChevron />
      </Link>

      <ul className={panelClass} role="menu">
        {item.children!.map((child) => (
          <NavDropdownItem
            key={child.label}
            item={child}
            onClose={onClose}
            menuVariant={isSoftware ? "software" : undefined}
            pathname={pathname}
          />
        ))}
      </ul>
    </li>
  );
}

function MobileMenuItem({
  item,
  pathname,
  onClose,
  depth = 0,
}: {
  item: NavigationItem;
  pathname: string;
  onClose: () => void;
  depth?: number;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const padding = { paddingLeft: `${depth * 1}rem` } as const;

  if (!hasChildren) {
    if (!item.href) return null;
    return (
      <Link
        href={item.href}
        className={cn(
          "aptus-masthead__link",
          isItemActive(item, pathname) && "is-active",
        )}
        style={padding}
        onClick={onClose}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <>
      {item.href ? (
        <Link href={item.href} className="aptus-masthead__link" style={padding} onClick={onClose}>
          {item.label}
        </Link>
      ) : (
        <span className="aptus-masthead__link" style={padding}>
          {item.label}
        </span>
      )}
      <ul className="aptus-masthead__mobile-list">
        {item.children!.map((child) => (
          <li key={child.label}>
            <MobileMenuItem
              item={child}
              pathname={pathname}
              onClose={onClose}
              depth={depth + 1}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function NavMenu({ items }: NavMenuProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const resetFlyouts = useCallback(() => {
    document.querySelectorAll<HTMLElement>(".aptus-masthead__dropdown-panel").forEach((panel) => {
      panel.classList.remove("is-flip-x");
      panel.style.removeProperty("top");
      panel.style.removeProperty("bottom");
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => {
      resetFlyouts();
      if (window.matchMedia("(min-width: 1025px)").matches) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resetFlyouts]);

  return (
    <>
      <nav aria-label="Main navigation" className="aptus-masthead__center">
        <ul className="aptus-masthead__menu">
          {items.map((item) => (
            <DropdownItem key={item.label} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="aptus-masthead__toggler"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div className={cn("aptus-masthead__mobile", mobileOpen && "is-open")}>
        <ul className="aptus-masthead__mobile-list">
          {items.map((item) => (
            <li key={item.label}>
              <MobileMenuItem
                item={item}
                pathname={pathname}
                onClose={() => setMobileOpen(false)}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
