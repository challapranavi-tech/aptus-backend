"use client";

import { config } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBagShopping, faHeadset, faKey, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faFileLines, faMoneyBill1 } from "@fortawesome/free-regular-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

export type PortalNavIconName =
  | "dashboard"
  | "products"
  | "subscriptions"
  | "orders"
  | "invoices"
  | "licenses"
  | "notifications"
  | "support"
  | "profile"
  | "settings"
  | "box"
  | "key"
  | "headphones"
  | "download"
  | "videos"
  | "bell"
  | "chevron"
  | "purchase"
  | "logout"
  | "cart"
  | "clock";

/** Matches FA kit-style `byPrefixAndName.fas|far[...]` lookups. */
const byPrefixAndName = {
  fas: {
    "bag-shopping": faBagShopping,
    key: faKey,
    headset: faHeadset,
    "right-from-bracket": faRightFromBracket,
  },
  far: {
    "money-bill-1": faMoneyBill1,
    "file-lines": faFileLines,
  },
} as const;

const FA_ICONS: Partial<Record<PortalNavIconName, IconDefinition>> = {
  orders: byPrefixAndName.fas["bag-shopping"],
  box: byPrefixAndName.fas["bag-shopping"],
  licenses: byPrefixAndName.fas.key,
  key: byPrefixAndName.fas.key,
  support: byPrefixAndName.fas.headset,
  headphones: byPrefixAndName.fas.headset,
  purchase: byPrefixAndName.far["money-bill-1"],
  subscriptions: byPrefixAndName.far["money-bill-1"],
  products: byPrefixAndName.far["money-bill-1"],
  invoices: byPrefixAndName.far["file-lines"],
  logout: byPrefixAndName.fas["right-from-bracket"],
};

const PATHS: Partial<Record<PortalNavIconName, string>> = {
  dashboard: "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z",
  notifications: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  profile: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  settings:
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  videos:
    "M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  chevron: "M6 9l6 6 6-6",
  cart: "M6 6h15l-1.5 9h-12zM6 6l-2-3H1M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  clock: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

export function PortalNavIcon({
  name,
  className,
}: {
  name: PortalNavIconName;
  className?: string;
}) {
  const faIcon = FA_ICONS[name];
  if (faIcon) {
    return (
      <FontAwesomeIcon
        icon={faIcon}
        className={className}
        aria-hidden
      />
    );
  }

  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
