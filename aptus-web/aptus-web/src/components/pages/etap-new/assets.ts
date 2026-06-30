/** ETAP homepage images — served from ETAP CDN (local SVGs stay in public/assets/etap-home/). */
const LOCAL_BASE = "/assets/etap-home";
const CDN_BASE = "https://cdn.etap.com/content-etap-prod/images/default-source";

/** CDN path keyed by local filename (used in home-data). */
const ETAP_CDN_FILES: Record<string, string> = {
  "bg-banner.png": "etap-2026/bg-banner.png",
  "homepage_banner_small-utilities-2.png": "banners/home-banner/homepage_banner_small-utilities-2.png",
  "etap-demo.png": "banners/home-banner/etap-demo.png",
  "etap-2026-banner.png": "banners/home-banner/etap-2026-banner.png",
  "etap-2026-log_v2.png": "etap-2026/etap-2026-log_v2.png",
  "etap-webinar-series-202609005215-6097-493f-88f6-784131bf56c3.png":
    "logo-cdn/product-logos/etap-webinar-series-202609005215-6097-493f-88f6-784131bf56c3.png",
  "image-placeholder.jpg": "default-album/image-placeholder.jpg",
  "power-simulator-dashboard.png": "etap-subscription/power-simulator-dashboard.png",
  "etap-solutions-overview-1.jpg": "static-cdn/product-overview/thumbnails/etap-solutions-overview-1.jpg",
  "navigation_icon-etap2026.png": "etap-2026/navigation_icon-etap2026.png",
  "background-slides-marketing-web430355a4-af36-43fd-95e0-ce91a5588721.png":
    "static-cdn/homepage/product-portfolio/background-slides-marketing-web430355a4-af36-43fd-95e0-ce91a5588721.png",
  "product_porfolio-see-min.png": "static-cdn/homepage/product-portfolio/product_porfolio-see-min.png",
  "product_porfolio-caneco-2-min.png": "static-cdn/homepage/product-portfolio/product_porfolio-caneco-2-min.png",
  "etap-2023-webinar-series-psms-web.png":
    "resource-thumbnails-cdn/video-thumbnails/etap-2023-webinar-series-psms-web.png",
  "etap-2023-webinar-series-escada-web.png":
    "resource-thumbnails-cdn/video-thumbnails/etap-2023-webinar-series-escada-web.png",
  "etap-2023-webinar-series-zsi-web.png":
    "resource-thumbnails-cdn/video-thumbnails/etap-2023-webinar-series-zsi-web.png",
  "volt-var-video-thumbnail.png": "resource-thumbnails-cdn/video-thumbnails/volt-var-video-thumbnail.png",
  "etap-engineering-consulting_85924038-6281-4020-b279-962a08f51a90.png":
    "industries/engineering-consulting/etap-engineering-consulting_85924038-6281-4020-b279-962a08f51a90.png",
  "data-centers.png": "industries/data-centers/data-centers.png",
  "oil-gas_8fb71d5f-d1ce-462e-8212-ebfe8e6dc2ee.png": "industries/oil-and-gas/oil-gas_8fb71d5f-d1ce-462e-8212-ebfe8e6dc2ee.png",
  "systems-transportation.png": "systems/transportation/systems-transportation.png",
  "manufacturing-icon_22198ab3-d3c1-4cb2-83be-d1109c166e40.png":
    "industries/manufacturing/manufacturing-icon_22198ab3-d3c1-4cb2-83be-d1109c166e40.png",
  "power-generation-icon_7d20d4cc-d0ff-4d8c-948d-f82b649cd9d6.png":
    "industries/fossil-fuel-generation/power-generation-icon_7d20d4cc-d0ff-4d8c-948d-f82b649cd9d6.png",
  "metals-mining-icon_d9ce865d-6c22-43a9-a340-45427052be32.png":
    "industries/metals-and-mining/metals-mining-icon_d9ce865d-6c22-43a9-a340-45427052be32.png",
  "nuclear-power-generation-icon_d9336e80-c8e6-422c-9e75-fd246eb9d9f5.png":
    "industries/nuclear-generation/nuclear-power-generation-icon_d9336e80-c8e6-422c-9e75-fd246eb9d9f5.png",
  "etap-renewable-energy-icon_ae38ee5a-8eec-4eb8-9425-9ab53fc76e10.png":
    "industries/renewables/etap-renewable-energy-icon_ae38ee5a-8eec-4eb8-9425-9ab53fc76e10.png",
  "utility-distribution-icon_699ec056-01c1-4df1-b7b7-17ac84c55c52.png":
    "industries/utility-distribution/utility-distribution-icon_699ec056-01c1-4df1-b7b7-17ac84c55c52.png",
  "utility-transmission-1_a15cd5c1-1555-4630-b220-2f5532d416bd.png":
    "industries/utility-transmission/utility-transmission-1_a15cd5c1-1555-4630-b220-2f5532d416bd.png",
  "government-defense-facilities_f795d055-ccdd-464a-aa3a-6af8362221ba.png":
    "industries/government-defense/government-defense-facilities_f795d055-ccdd-464a-aa3a-6af8362221ba.png",
  "education-icon_242cdc3b-e0e4-43dc-9b03-04dff1a934f7.png":
    "industries/academia/education-icon_242cdc3b-e0e4-43dc-9b03-04dff1a934f7.png",
  "duke-energy-logo.png": "logo-cdn/user-logos-testimonials/duke-energy-logo.png",
  "novec-logo.png": "logo-cdn/user-logos-testimonials/novec-logo.png",
  "exelon-logo.png": "logo-cdn/user-logos-testimonials/exelon-logo.png",
  "parsons-logo.png": "logo-cdn/user-logos-testimonials/parsons-logo.png",
  "dominion-logo.png": "logo-cdn/user-logos-testimonials/dominion-logo.png",
  "first-energy-logo.png": "logo-cdn/user-logos-testimonials/first-energy-logo.png",
  // CMS /etap route industry thumbnails (shorter filenames in Odoo JSON)
  "utilities.png": "industries/utility-distribution/utility-distribution-icon_699ec056-01c1-4df1-b7b7-17ac84c55c52.png",
  "oil-gas.png": "industries/oil-and-gas/oil-gas_8fb71d5f-d1ce-462e-8212-ebfe8e6dc2ee.png",
  "manufacturing.png": "industries/manufacturing/manufacturing-icon_22198ab3-d3c1-4cb2-83be-d1109c166e40.png",
  "transportation.png": "systems/transportation/systems-transportation.png",
  "commercial.png": "industries/government-defense/government-defense-facilities_f795d055-ccdd-464a-aa3a-6af8362221ba.png",
  "renewables.png": "industries/renewables/etap-renewable-energy-icon_ae38ee5a-8eec-4eb8-9425-9ab53fc76e10.png",
  "etap-solutions.png":
    "static-cdn/homepage/product-portfolio/background-slides-marketing-web430355a4-af36-43fd-95e0-ce91a5588721.png",
};

/** Resolve a homepage image — CDN for raster assets, local public folder for SVGs. */
export function etapAsset(filename: string): string {
  const cdnPath = ETAP_CDN_FILES[filename];
  if (cdnPath) return `${CDN_BASE}/${cdnPath}`;
  return `${LOCAL_BASE}/${filename}`;
}

/** Map Odoo CMS `/images/etap/...` paths to working CDN or local URLs. */
export function resolveEtapHomeCmsImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  if (url === "/images/Aptus-infotech-orignal-clrs-logo.png" || url === "/images/etap/aptus-logo.png") {
    return "/images/Aptus-infotech-orignal-clrs-logo.png";
  }
  if (url === "/images/etap/logo-etap.svg") {
    return etapAsset("logo-etap.svg");
  }

  const etapPrefix = "/images/etap/";
  if (url.startsWith(etapPrefix)) {
    const rel = url.slice(etapPrefix.length);
    const basename = rel.includes("/") ? rel.split("/").pop()! : rel;
    if (ETAP_CDN_FILES[basename]) return etapAsset(basename);
  }

  return etapAsset(url.replace(/^\//, ""));
}

export const ETAP_HOME_ASSETS = {
  logoEtap: etapAsset("logo-etap.svg"),
  logoAptus: "/images/Aptus-infotech-orignal-clrs-logo.png",
  heroSlides: {
    bgBanner: etapAsset("bg-banner.png"),
    utilitiesBanner: etapAsset("homepage_banner_small-utilities-2.png"),
    etapDemo: etapAsset("etap-demo.png"),
    etap2026Banner: etapAsset("etap-2026-banner.png"),
    etap2026Logo: etapAsset("etap-2026-log_v2.png"),
    webinarLogo: etapAsset("etap-webinar-series-202609005215-6097-493f-88f6-784131bf56c3.png"),
    thumbPlaceholder: etapAsset("image-placeholder.jpg"),
  },
  pricingDashboard: etapAsset("power-simulator-dashboard.png"),
  navCatalog: etapAsset("etap-solutions-overview-1.jpg"),
  navNewsIcon: etapAsset("navigation_icon-etap2026.png"),
  products: {
    etap: etapAsset("background-slides-marketing-web430355a4-af36-43fd-95e0-ce91a5588721.png"),
    see: etapAsset("product_porfolio-see-min.png"),
    caneco: etapAsset("product_porfolio-caneco-2-min.png"),
  },
  videos: {
    psms: etapAsset("etap-2023-webinar-series-psms-web.png"),
    escada: etapAsset("etap-2023-webinar-series-escada-web.png"),
    zsi: etapAsset("etap-2023-webinar-series-zsi-web.png"),
    voltVar: etapAsset("volt-var-video-thumbnail.png"),
  },
} as const;
