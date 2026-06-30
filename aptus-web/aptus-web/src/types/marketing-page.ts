import type { AccentTitleContent } from "@/types/sections";

export type MarketingHeroContent = {
  id: string;
  visible?: boolean;
  title: AccentTitleContent;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type MarketingIntroContent = {
  id: string;
  visible?: boolean;
  eyebrow?: string;
  title?: AccentTitleContent;
  paragraphs: string[];
};

export type MarketingCardItemContent = {
  title: string;
  body: string;
};

export type MarketingCardsContent = {
  id: string;
  visible?: boolean;
  eyebrow?: string;
  title?: AccentTitleContent;
  align?: "left" | "center";
  items: MarketingCardItemContent[];
};

export type MarketingListContent = {
  id: string;
  visible?: boolean;
  eyebrow?: string;
  title?: AccentTitleContent;
  items: string[];
};

export type MarketingTeamMemberContent = {
  name: string;
  role: string;
  bio: string;
  imageSrc?: string;
};

export type MarketingTeamContent = {
  id: string;
  visible?: boolean;
  eyebrow?: string;
  title?: AccentTitleContent;
  members: MarketingTeamMemberContent[];
  closingParagraphs?: string[];
};

export type MarketingCertItemContent = {
  title: string;
  description: string;
  downloadHref?: string;
  downloadLabel?: string;
};

export type MarketingCertificationsContent = {
  id: string;
  visible?: boolean;
  eyebrow?: string;
  title?: AccentTitleContent;
  intro?: string;
  items: MarketingCertItemContent[];
  footerParagraph?: string;
};

export type MarketingContactInfoContent = {
  id: string;
  visible?: boolean;
  title?: AccentTitleContent;
  subtitle?: string;
  address?: string;
  email?: string;
  phone?: string;
};

export type MarketingTextContent = {
  id: string;
  visible?: boolean;
  eyebrow?: string;
  title?: AccentTitleContent;
  paragraphs: string[];
  background?: "white" | "muted";
  align?: "left" | "center";
};

export type MarketingPageSections = {
  hero?: MarketingHeroContent;
  intro?: MarketingIntroContent;
  cards?: MarketingCardsContent;
  /** Additional card grids (features, benefits, etc.). */
  cardSections?: MarketingCardsContent[];
  lists?: MarketingListContent[];
  team?: MarketingTeamContent;
  certifications?: MarketingCertificationsContent;
  contactInfo?: MarketingContactInfoContent;
  text?: MarketingTextContent;
  showKeyEnablers?: boolean;
  showPartnerships?: boolean;
  showContactCta?: boolean;
};

export type MarketingPageContent = MarketingPageSections & {
  metaTitle: string | null;
  metaDescription: string | null;
  source: "static" | "odoo";
};
