/** Placeholder content for the Knowledge Hub mega-menu (desktop nav). */

export interface KnowledgeHubLink {
  label: string;
  href: string;
}

export const KNOWLEDGE_HUB_LINKS: KnowledgeHubLink[] = [
  { label: "Blog", href: "/our-story" },
  { label: "Customer Stories", href: "/winning-together" },
  { label: "Knowledge Base", href: "/software-solutions" },
  { label: "FAQ", href: "/contact-us" },
  { label: "Documentation", href: "/aptus-policy" },
  { label: "Resources", href: "/why-aptus-infotech" },
  { label: "Academy", href: "/training" },
];

export const KNOWLEDGE_HUB_FEATURED = {
  tag: "Customer Story",
  title: "How Aptus Infotech **streamlined licensing** for a regional engineering firm.",
  metric: "40%",
  metricLabel: "Faster license deployment",
  href: "/winning-together",
} as const;

export const KNOWLEDGE_HUB_NEWS = {
  title: "Latest news",
  headline: "Aptus Infotech expands Autodesk and Microsoft partnership across the GCC.",
  href: "/our-story",
} as const;

export const KNOWLEDGE_HUB_INSIGHT = {
  title: "Featured insights",
  headline: "Choosing the right subscription model for design and construction teams.",
  href: "/software-solutions",
} as const;

export const KNOWLEDGE_HUB_LABEL = "Knowledge Hub";
