export { resolveCmsImageSrc, imageStem } from "@shared/lib/cms-image";

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatSlug(slug: string): string {
  return slug.replace(/^\/+|\/+$/g, "").toLowerCase();
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalizedPath}`;
}

export function buildPageMetadata(page: {
  title: string;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
  };
}) {
  return {
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
    openGraph: page.seo?.ogImage
      ? { images: [{ url: page.seo.ogImage }] }
      : undefined,
    alternates: page.seo?.canonicalUrl
      ? { canonical: page.seo.canonicalUrl }
      : undefined,
    robots: page.seo?.noIndex ? { index: false, follow: false } : undefined,
  };
}
