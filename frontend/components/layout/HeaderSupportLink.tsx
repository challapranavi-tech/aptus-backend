"use client";

import Link from "next/link";

export function HeaderSupportLink() {
  return (
    <Link
      href="/contact-us"
      className="aptus-header-support"
      aria-label="Support"
      title="Support"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M12 2a8 8 0 0 0-8 8v1.5c0 .83.67 1.5 1.5 1.5H7v3.5l3.5-2h3c4.42 0 8-3.58 8-8v-1.5A8 8 0 0 0 12 2zm0 2a6 6 0 0 1 6 6v1.5c0 .28-.22.5-.5.5h-11c-.28 0-.5-.22-.5-.5V10a6 6 0 0 1 6-6zm-3 8h6v1H9v-1z"
        />
      </svg>
    </Link>
  );
}
