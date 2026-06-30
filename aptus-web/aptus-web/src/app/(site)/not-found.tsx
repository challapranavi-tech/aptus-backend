import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function SiteNotFound() {
  return (
    <section className="mx-auto max-w-content px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-aptus-primary">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-aptus-primary">Page not found</h1>
      <p className="mx-auto mt-4 max-w-lg text-base text-gray-600">
        This page is not available yet. It may still be syncing from Odoo or the URL may have
        changed.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded bg-aptus-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        Back to {SITE.name}
      </Link>
    </section>
  );
}
