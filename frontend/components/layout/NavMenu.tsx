"use client";

import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/types";
import { clearLegacyPortalSession, syncLegacyPortalSession } from "@/lib/access-token";
import { fetchAuthMeShared, invalidateAuthMeCache } from "@/lib/auth-me-client";
import { useLocale } from "@/context/LocaleProvider";
import { translateNavLabel } from "@/locales/messages";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

interface NavMenuProps {
  items: NavigationItem[];
}

function NavLabel({ item }: { item: NavigationItem }) {
  const { locale } = useLocale();
  return <>{translateNavLabel(locale, item.href, item.label)}</>;
}

const VIEWPORT_PAD = 12;
const DESKTOP_MQ = "(min-width: 1025px)";

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

/** Blur focused controls in sibling dropdowns so focus-within cannot keep multiple panels open. */
function blurSiblingDropdownFocus(current: HTMLElement) {
  const menu = current.closest(".aptus-masthead__menu");
  if (!menu) return;

  menu.querySelectorAll<HTMLElement>(".aptus-masthead__dropdown").forEach((dropdown) => {
    if (dropdown === current || current.contains(dropdown) || dropdown.contains(current)) return;
    const focused = dropdown.querySelector(":focus");
    if (focused instanceof HTMLElement) focused.blur();
  });
}

function onDropdownPointerEnter(event: MouseEvent<HTMLLIElement>) {
  const current = event.currentTarget;
  blurSiblingDropdownFocus(current);

  let dropdown: HTMLElement | null = current;
  while (dropdown) {
    if (dropdown.classList.contains("aptus-masthead__dropdown")) {
      scheduleFlyoutPosition(dropdown);
    }
    dropdown = dropdown.parentElement?.closest<HTMLElement>(".aptus-masthead__dropdown") ?? null;
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
  expandMode = "side",
  pathname,
}: {
  item: NavigationItem;
  onClose?: () => void;
  nested?: boolean;
  menuVariant?: "software";
  /** side = horizontal flyout; vertical = accordion under the parent (Products & Services). */
  expandMode?: "side" | "vertical";
  pathname: string;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isSoftware =
    item.label === "Software" || item.href === "/software-solutions";
  const isElv =
    item.label === "ELV Solutions" || item.href === "/elv-solutions";
  const effectiveVariant = menuVariant ?? (isSoftware ? "software" : undefined);
  const isVertical = expandMode === "vertical";
  const linkClass = nested
    ? "aptus-masthead__link aptus-masthead__link--nested"
    : "aptus-masthead__link";
  const chevronDirection =
    isVertical || (!(isSoftware || isElv) && effectiveVariant !== "software")
      ? "down"
      : "right";
  const active = isDirectlyActive(item, pathname);
  const panelId = useId();

  if (hasChildren) {
    const isHubMenu = isSoftware || isElv;
    // Products & Services: keep expanding vertically at every level
    const childExpandMode = expandMode;
    const useStacked = isVertical;
    const nestedPanelClass = cn(
      "aptus-masthead__dropdown-panel",
      useStacked
        ? "aptus-masthead__dropdown-panel--stacked"
        : "aptus-masthead__dropdown-panel--nested",
      isHubMenu && !useStacked && "aptus-masthead__dropdown-panel--wide",
      isHubMenu && !useStacked && "aptus-masthead__dropdown-panel--hub",
      isSoftware && "aptus-masthead__dropdown-panel--software",
      isElv && "aptus-masthead__dropdown-panel--elv",
      useStacked && isElv && "aptus-masthead__dropdown-panel--elv-stacked",
    );

    return (
      <li
        className={cn(
          "aptus-masthead__dropdown",
          useStacked
            ? "aptus-masthead__dropdown--accordion"
            : "aptus-masthead__dropdown--nested",
          isHubMenu && "aptus-masthead__dropdown--hub",
        )}
        onMouseEnter={useStacked ? undefined : onDropdownPointerEnter}
      >
        {item.href ? (
          <Link
            href={item.href}
            className={`${linkClass} aptus-masthead__link--parent${active ? " is-active" : ""}`}
            aria-haspopup="menu"
            aria-controls={panelId}
            onClick={onClose}
          >
            <NavLabel item={item} />
            <NavChevron direction={chevronDirection} />
          </Link>
        ) : (
          <span
            className={`${linkClass} aptus-masthead__link--parent aptus-masthead__link--flyout-trigger`}
            aria-haspopup="menu"
            aria-controls={panelId}
          >
            <NavLabel item={item} />
            <NavChevron direction={chevronDirection} />
          </span>
        )}
        <ul id={panelId} className={nestedPanelClass} role="menu">
          {item.children!.map((child) => (
            <NavDropdownItem
              key={child.label}
              item={child}
              onClose={onClose}
              nested
              menuVariant={effectiveVariant}
              expandMode={childExpandMode}
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
        <NavLabel item={item} />
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
  onClose: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const active = isItemActive(item, pathname);
  const isProducts = item.label === "Products and Services";
  const isSoftware =
    item.label === "Software" || item.href === "/software-solutions";
  const isElv =
    item.label === "ELV Solutions" || item.href === "/elv-solutions";
  const panelId = useId();

  if (!hasChildren) {
    if (!item.href) return null;
    return (
      <li>
        <Link
          href={item.href}
          className={cn("aptus-masthead__link", active && "is-active")}
          onClick={onClose}
        >
          <NavLabel item={item} />
        </Link>
      </li>
    );
  }

  const panelClass = cn(
    "aptus-masthead__dropdown-panel",
    (isElv || isSoftware) && "aptus-masthead__dropdown-panel--wide",
    isSoftware && "aptus-masthead__dropdown-panel--software",
    isElv && "aptus-masthead__dropdown-panel--elv",
    isProducts && "aptus-masthead__dropdown-panel--products",
  );

  return (
    <li
      className={cn(
        "aptus-masthead__dropdown",
        isProducts && "aptus-masthead__dropdown--products",
      )}
      onMouseEnter={onDropdownPointerEnter}
    >
      {item.href ? (
        <Link
          href={item.href}
          className={cn("aptus-masthead__link", active && "is-active")}
          aria-haspopup="menu"
          aria-controls={panelId}
          onClick={onClose}
        >
          <NavLabel item={item} />
          <NavChevron />
        </Link>
      ) : (
        <span
          className={cn(
            "aptus-masthead__link aptus-masthead__link--flyout-trigger",
            active && "is-active",
          )}
          aria-haspopup="menu"
          aria-controls={panelId}
        >
          <NavLabel item={item} />
          <NavChevron />
        </span>
      )}

      <ul id={panelId} className={panelClass} role="menu">
        {item.children!.map((child) => (
          <NavDropdownItem
            key={child.label}
            item={child}
            onClose={onClose}
            menuVariant={
              child.label === "Software" || child.href === "/software-solutions"
                ? "software"
                : undefined
            }
            expandMode="side"
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
  const hasChildren = Boolean(item.children?.length);
  const childActive = hasChildren && isItemActive(item, pathname);
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive, pathname]);

  if (!hasChildren) {
    if (!item.href) return null;
    return (
      <Link
        href={item.href}
        className={cn(
          "aptus-masthead__link aptus-masthead__mobile-link",
          isDirectlyActive(item, pathname) && "is-active",
        )}
        data-depth={depth}
        onClick={onClose}
      >
        <NavLabel item={item} />
      </Link>
    );
  }

  return (
    <div className="aptus-masthead__mobile-group" data-depth={depth}>
      <div className="aptus-masthead__mobile-row">
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              "aptus-masthead__link aptus-masthead__mobile-link",
              isDirectlyActive(item, pathname) && "is-active",
            )}
            onClick={onClose}
          >
            <NavLabel item={item} />
          </Link>
        ) : (
          <button
            type="button"
            className="aptus-masthead__link aptus-masthead__mobile-link"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <NavLabel item={item} />
          </button>
        )}
        <button
          type="button"
          className={cn("aptus-masthead__mobile-chevron", open && "is-open")}
          aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <NavChevron />
        </button>
      </div>
      {open ? (
        <ul className="aptus-masthead__mobile-list aptus-masthead__mobile-list--nested">
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
      ) : null}
    </div>
  );
}

/** Login in the hamburger only when signed out (desktop Login stays in the auth strip). */
function MobileNavAuthLink({ onClose }: { onClose: () => void }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        const result = await fetchAuthMeShared();
        if (cancelled) return;
        if (!result.ok) {
          setSignedIn(false);
          if (result.status === 401 || result.status === 403) clearLegacyPortalSession();
          return;
        }
        syncLegacyPortalSession(result.user, true, { silent: true });
        setSignedIn(true);
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    };
    const onSessionChange = () => {
      invalidateAuthMeCache();
      void sync();
    };
    void sync();
    window.addEventListener("storage", onSessionChange);
    window.addEventListener("aptus:session-changed", onSessionChange);
    window.addEventListener("aptus:portal-ready", onSessionChange);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onSessionChange);
      window.removeEventListener("aptus:session-changed", onSessionChange);
      window.removeEventListener("aptus:portal-ready", onSessionChange);
    };
  }, []);

  if (signedIn !== false) return null;

  return (
    <li className="aptus-masthead__mobile-auth">
      <Link
        href="/login"
        className="aptus-masthead__link aptus-masthead__mobile-link"
        onClick={onClose}
      >
        Login
      </Link>
    </li>
  );
}

export function NavMenu({ items }: NavMenuProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // ponytail: CSS :hover menus stay open after click while the pointer is still over them;
  // lock hides panels until the pointer leaves the menu (or route changes).
  const [menuLocked, setMenuLocked] = useState(false);

  const resetFlyouts = useCallback(() => {
    document.querySelectorAll<HTMLElement>(".aptus-masthead__dropdown-panel").forEach((panel) => {
      panel.classList.remove("is-flip-x");
      panel.style.removeProperty("top");
      panel.style.removeProperty("bottom");
    });
  }, []);

  const closeDesktopMenus = useCallback(() => {
    setMenuLocked(true);
    resetFlyouts();
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest(".aptus-masthead__menu")) {
      active.blur();
    }
  }, [resetFlyouts]);

  useEffect(() => {
    setMobileOpen(false);
    setMenuLocked(false);
    resetFlyouts();
  }, [pathname, resetFlyouts]);

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
      if (window.matchMedia(DESKTOP_MQ).matches) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resetFlyouts]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "Escape") return;
    closeDesktopMenus();
  };

  const onMenuBlur = (event: FocusEvent<HTMLUListElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    resetFlyouts();
  };

  return (
    <>
      <nav aria-label="Main navigation" className="aptus-masthead__center">
        <ul
          className={cn("aptus-masthead__menu", menuLocked && "is-locked")}
          onMouseLeave={() => setMenuLocked(false)}
          onKeyDown={onMenuKeyDown}
          onBlur={onMenuBlur}
        >
          {items.map((item) => (
            <DropdownItem
              key={item.label}
              item={item}
              pathname={pathname}
              onClose={closeDesktopMenus}
            />
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
          <MobileNavAuthLink onClose={() => setMobileOpen(false)} />
        </ul>
      </div>
    </>
  );
}
