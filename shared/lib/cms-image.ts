import map from "./cms-image-map.json";

type CmsImageMap = {
  exact: Record<string, string>;
  stem: Record<string, string>;
};

const IMAGE_MAP = map as CmsImageMap;

/** Normalize WP/Elementor filename noise to a stable stem. */
export function imageStem(filename: string): string {
  let s = filename.replace(/\.[^.]+$/, "").toLowerCase();
  s = s.replace(/_\d+$/g, "");
  s = s.replace(/-\d+x\d+/g, "");
  s = s.replace(/-e\d{8,}/g, "");
  s = s.replace(/-r[a-z0-9]{12,}/g, "");
  s = s.replace(/-\d+$/g, "");
  return s;
}

/**
 * Map dead aptusinfotech.com/wp-content/uploads URLs (and bare /images/basenames)
 * onto local public/images files — including Elementor-hashed mirrors.
 */
export function resolveCmsImageSrc(src: string): string {
  if (!src) return src;

  let file: string | undefined;
  if (src.startsWith("/images/")) {
    file = src.split("?")[0].split("/").pop();
  } else {
    try {
      const url = new URL(src);
      if (!/(^|\.)aptusinfotech\.com$/i.test(url.hostname)) return src;
      if (!url.pathname.includes("/wp-content/uploads/")) return src;
      file = decodeURIComponent(url.pathname.split("/").pop() || "");
    } catch {
      return src;
    }
  }

  if (!file) return src;
  const key = file.toLowerCase();
  const mapped =
    IMAGE_MAP.exact[key] ?? IMAGE_MAP.stem[imageStem(file)] ?? undefined;
  if (mapped) return mapped;
  // Last resort: keep absolute WP (still 404) only when we have no local guess.
  if (src.startsWith("/")) return src;
  return `/images/${file}`;
}
