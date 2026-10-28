import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type AdobeLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  children: ReactNode;
};

/** Real navigation link for /adobe CTAs and product cards. */
export function AdobeLink({ href, children, ...rest }: AdobeLinkProps) {
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

/** @deprecated use AdobeLink — kept so older imports keep working during edit */
export const DeadLink = AdobeLink;
