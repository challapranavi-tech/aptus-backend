"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

type DeadLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
};

/** Visual link only — no navigation (Autodesk replica CTAs). */
export function DeadLink({ children, onClick, ...rest }: DeadLinkProps) {
  return (
    <a
      href="#"
      {...rest}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
