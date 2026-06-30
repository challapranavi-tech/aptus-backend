import { resolveOdooImageUrl } from "@/lib/cms/etap-image-url";
import type { EtapHeroContent, EtapOverviewContent, EtapPageContent } from "@/types/etap-page";
import { resolveEtapHomeCmsImage } from "./assets";
import {
  DEFAULT_ETAP_HOME_PAGE_DATA,
  type EtapHomePageData,
} from "./etap-home-types";
import { INDUSTRIES } from "./home-data";
import { ETAP_HOME_ASSETS } from "./assets";

function cmsImage(url: string | null | undefined, fallback: string): string {
  return resolveEtapHomeCmsImage(url) ?? resolveOdooImageUrl(url) ?? fallback;
}

const CMS_INDUSTRY_ALIASES: Record<string, string> = {
  utilities: "Utility Distribution",
  "oil & gas": "Energy and Chemicals",
  "oil and gas": "Energy and Chemicals",
  manufacturing: "Manufacturing",
  "data centers": "Data Centers",
  transportation: "Transportation",
  "renewable energy": "Renewables",
  renewables: "Renewables",
  "commercial buildings": "Government & Defense",
  "smart cities": "Government & Defense",
};

function normalizeIndustryTitle(title: string): string {
  return CMS_INDUSTRY_ALIASES[title.toLowerCase()] ?? title;
}

function industryHref(title: string): string {
  const normalized = normalizeIndustryTitle(title);
  const match = INDUSTRIES.find(
    (item) => item.title.toLowerCase() === normalized.toLowerCase(),
  );
  return match?.href ?? "https://etap.com/industries";
}

function industryImage(title: string, cmsSrc?: string): string {
  const normalized = normalizeIndustryTitle(title);
  const match = INDUSTRIES.find(
    (item) => item.title.toLowerCase() === normalized.toLowerCase(),
  );
  return cmsImage(cmsSrc, match?.image ?? ETAP_HOME_ASSETS.heroSlides.bgBanner);
}

function accentEtap(text: string): string {
  return text.replace(/\bETAP\b/g, '<span class="accent">ETAP</span>');
}

function buildHeadlineHtml(hero?: EtapHeroContent): string {
  if (!hero?.description?.trim()) {
    return DEFAULT_ETAP_HOME_PAGE_DATA.intro.headlineHtml;
  }

  const sentences =
    hero.description.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) ?? [];
  if (sentences.length >= 2) {
    return accentEtap(`${sentences[0]} ${sentences[1]}`);
  }
  if (sentences.length === 1) {
    return accentEtap(sentences[0]);
  }

  return accentEtap(hero.description);
}

function buildSubtitleHtml(overview?: EtapOverviewContent): string {
  const subtitle = overview?.subtitle?.trim();
  if (!subtitle) {
    return DEFAULT_ETAP_HOME_PAGE_DATA.intro.subtitleHtml;
  }

  const fullLineMatch = subtitle.match(
    /^Solutions for electrical systems from (.+)$/i,
  );
  if (fullLineMatch) {
    return `Solutions for electrical systems from <span class="accent">${fullLineMatch[1]}</span>`;
  }

  return `Solutions for electrical systems from <span class="accent">${subtitle}</span>`;
}

function buildIntroBodyHtml(
  hero?: EtapHeroContent,
  overview?: EtapOverviewContent,
): string {
  const paragraphs = overview?.paragraphs?.filter(Boolean);
  if (paragraphs?.length) {
    return paragraphs.join(" ");
  }

  if (!hero?.description?.trim()) {
    return DEFAULT_ETAP_HOME_PAGE_DATA.intro.bodyHtml;
  }

  const sentences =
    hero.description.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) ?? [];
  if (sentences.length > 2) {
    return sentences.slice(2).join(" ");
  }

  return hero.description;
}

function industriesSectionTitle(
  industries?: EtapPageContent["industries"],
): string {
  const title = industries?.title;
  if (!title) return "Industries";
  if (typeof title === "string") return title;
  return [title.before, title.accent, title.after].filter(Boolean).join(" ").trim() || "Industries";
}

/** Merge Odoo CMS content onto static ETAP homepage defaults (styling stays in frontend). */
export function mapCmsToEtapHome(cms: EtapPageContent): EtapHomePageData {
  const hero = cms.hero;
  const overview = cms.overview;
  const industries = cms.industries;
  const testimonials = cms.testimonials;
  const cta = cms.cta;

  const navbar = {
    aptusLogo: cmsImage(hero?.aptusLogoSrc, DEFAULT_ETAP_HOME_PAGE_DATA.navbar.aptusLogo),
    aptusLogoAlt: hero?.aptusLogoAlt ?? DEFAULT_ETAP_HOME_PAGE_DATA.navbar.aptusLogoAlt,
    etapLogo: cmsImage(hero?.etapLogoSrc, DEFAULT_ETAP_HOME_PAGE_DATA.navbar.etapLogo),
    etapLogoAlt: hero?.etapLogoAlt ?? DEFAULT_ETAP_HOME_PAGE_DATA.navbar.etapLogoAlt,
    primaryCta: {
      label: hero?.primaryCta?.label ?? DEFAULT_ETAP_HOME_PAGE_DATA.navbar.primaryCta.label,
      href: hero?.primaryCta?.href ?? DEFAULT_ETAP_HOME_PAGE_DATA.navbar.primaryCta.href,
    },
    secondaryCta: {
      label: hero?.secondaryCta?.label ?? DEFAULT_ETAP_HOME_PAGE_DATA.navbar.secondaryCta.label,
      href: hero?.secondaryCta?.href ?? DEFAULT_ETAP_HOME_PAGE_DATA.navbar.secondaryCta.href,
    },
  };

  const intro = {
    headlineHtml: buildHeadlineHtml(hero),
    videoHref: DEFAULT_ETAP_HOME_PAGE_DATA.intro.videoHref,
    subtitleHtml: buildSubtitleHtml(overview),
    bodyHtml: buildIntroBodyHtml(hero, overview),
  };

  const pricing = {
    image: cmsImage(hero?.heroImageSrc, DEFAULT_ETAP_HOME_PAGE_DATA.pricing.image),
    imageAlt: hero?.heroImageAlt ?? DEFAULT_ETAP_HOME_PAGE_DATA.pricing.imageAlt,
    title: DEFAULT_ETAP_HOME_PAGE_DATA.pricing.title,
    description: DEFAULT_ETAP_HOME_PAGE_DATA.pricing.description,
    ctaHref: DEFAULT_ETAP_HOME_PAGE_DATA.pricing.ctaHref,
    ctaLabel: DEFAULT_ETAP_HOME_PAGE_DATA.pricing.ctaLabel,
  };

  const learning = {
    text: cta?.description ?? DEFAULT_ETAP_HOME_PAGE_DATA.learning.text,
    ctaLabel: cta?.primaryCta?.label ?? DEFAULT_ETAP_HOME_PAGE_DATA.learning.ctaLabel,
    ctaHref: cta?.primaryCta?.href ?? DEFAULT_ETAP_HOME_PAGE_DATA.learning.ctaHref,
  };

  const cmsIndustries =
    industries?.visible !== false && industries?.items?.length
      ? industries.items.map((item) => ({
          title: item.title,
          image: industryImage(item.title, item.imageSrc),
          href: industryHref(item.title),
        }))
      : null;

  const cmsTestimonials =
    testimonials?.visible !== false && testimonials?.items?.length
      ? testimonials.items.map((item) => ({
          logo: cmsImage(
            item.companyLogoSrc,
            DEFAULT_ETAP_HOME_PAGE_DATA.testimonials[0]?.logo ?? "",
          ),
          company: item.authorCompany ?? item.authorName ?? "Customer",
          quote: item.quote,
        }))
      : null;

  return {
    ...DEFAULT_ETAP_HOME_PAGE_DATA,
    source: cms.source ?? "odoo",
    navbar,
    intro,
    pricing,
    learning,
    industriesTitle: industriesSectionTitle(industries),
    industries: cmsIndustries ?? DEFAULT_ETAP_HOME_PAGE_DATA.industries,
    testimonials: cmsTestimonials ?? DEFAULT_ETAP_HOME_PAGE_DATA.testimonials,
  };
}
