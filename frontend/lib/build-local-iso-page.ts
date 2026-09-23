/**
 * ISO Certifications from committed frontend JSON.
 * Ships on frontend Vercel deploy — same pattern as home / our-story.
 */

import type { IsoPanel, Page } from "@/types";
import isoJson from "@/content/aptus-infotech-iso-certifications.json";

type RawTitle = { before?: string; accent?: string; after?: string };

function joinTitle(t?: RawTitle): string | undefined {
  if (!t) return undefined;
  return [t.before, t.accent, t.after].filter(Boolean).join(" ").trim() || undefined;
}

export function buildLocalIsoPage(): Page | null {
  const raw = isoJson;
  const hero = raw.hero;
  if (!hero?.title) return null;

  const intro = raw.intro?.visible !== false ? raw.intro : undefined;
  const footer = raw.text?.visible !== false ? raw.text : undefined;
  const coreList = raw.lists?.find((ls) => ls.visible !== false && ls.items?.length);

  const data: IsoPanel = {
    type: "iso-panel",
    title: joinTitle(hero.title),
    subtitle: hero.subtitle,
    introHeading: intro ? joinTitle(intro.title) : undefined,
    introParagraphs: intro?.paragraphs,
    coreHeading: coreList ? joinTitle(coreList.title) : undefined,
    coreItems: coreList?.items,
    certificates: (raw.featureRows ?? []).map((row) => ({
      heading: row.heading,
      headingAccent: row.headingAccent,
      media: row.imageSrc ? { src: row.imageSrc, alt: row.imageAlt ?? "" } : undefined,
      downloadHref: row.downloadHref,
    })),
    footerParagraphs: footer?.paragraphs,
  };

  if (!data.certificates.length) return null;

  return {
    id: "local:aptus-infotech-iso-certifications",
    slug: "aptus-infotech-iso-certifications",
    title: "Aptus Infotech ISO Certifications",
    seo: {
      title: "Aptus Infotech ISO Certifications | Aptus Infotech",
      description:
        "Aptus Infotech ISO 9001:2015, ISO 14001:2015, and ISO 45001:2018 certifications.",
    },
    sections: [
      {
        id: "page-iso-panel",
        type: "iso-panel",
        order: 1,
        data,
      },
    ],
  };
}
