import { cmsPresentationClasses, cmsPresentationDataAttrs } from "@shared/lib/design-system/presentation";
import type { Section, SectionType } from "@/types";
import type { ComponentType } from "react";
import { Banner } from "./Banner";
import { Contact } from "./Contact";
import { CTA } from "./CTA";
import { Features } from "./Features";
import { FlipCards } from "./FlipCards";
import { PolicyPanel } from "./PolicyPanel";
import { LegalPolicies } from "./LegalPolicies";
import { SoftwareLandingHero } from "./SoftwareLandingHero";
import { SoftwareInnerHero } from "./SoftwareInnerHero";
import { CareerPanel } from "./CareerPanel";
import { IsoPanel } from "./IsoPanel";
import { WhyPanel } from "./WhyPanel";
import { FeatureRow } from "./FeatureRow";
import { Hero } from "./Hero";
import { HeroSlider } from "./HeroSlider";
import { KeyEnablers } from "./KeyEnablers";
import { LogoGrid } from "./LogoGrid";
import { OurStory } from "./OurStory";
import { PageHeader } from "./PageHeader";
import { PageTitle } from "./PageTitle";
import { RichText } from "./RichText";
import { Services } from "./Services";
import { Team } from "./Team";
import { Testimonials } from "./Testimonials";
import { Faq } from "./Faq";

type SectionComponentProps = {
  data: Section["data"];
};

const sectionRegistry: Partial<Record<SectionType, ComponentType<SectionComponentProps>>> = {
  hero: Hero as ComponentType<SectionComponentProps>,
  "hero-slider": HeroSlider as ComponentType<SectionComponentProps>,
  banner: Banner as ComponentType<SectionComponentProps>,
  "feature-row": FeatureRow as ComponentType<SectionComponentProps>,
  "page-header": PageHeader as ComponentType<SectionComponentProps>,
  "page-title": PageTitle as ComponentType<SectionComponentProps>,
  "rich-text": RichText as ComponentType<SectionComponentProps>,
  "logo-grid": LogoGrid as ComponentType<SectionComponentProps>,
  team: Team as ComponentType<SectionComponentProps>,
  contact: Contact as ComponentType<SectionComponentProps>,
  features: Features as ComponentType<SectionComponentProps>,
  "flip-cards": FlipCards as ComponentType<SectionComponentProps>,
  "policy-panel": PolicyPanel as ComponentType<SectionComponentProps>,
  "legal-policies": LegalPolicies as ComponentType<SectionComponentProps>,
  "why-panel": WhyPanel as ComponentType<SectionComponentProps>,
  "iso-panel": IsoPanel as ComponentType<SectionComponentProps>,
  "career-panel": CareerPanel as ComponentType<SectionComponentProps>,
  "software-landing-hero": SoftwareLandingHero as ComponentType<SectionComponentProps>,
  "software-inner-hero": SoftwareInnerHero as ComponentType<SectionComponentProps>,
  "our-story": OurStory as ComponentType<SectionComponentProps>,
  services: Services as ComponentType<SectionComponentProps>,
  "key-enablers": KeyEnablers as ComponentType<SectionComponentProps>,
  cta: CTA as ComponentType<SectionComponentProps>,
  testimonials: Testimonials as ComponentType<SectionComponentProps>,
  faq: Faq as ComponentType<SectionComponentProps>,
};

interface SectionRendererProps {
  sections: Section[];
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <>
      {sortedSections.map((section) => {
        // Honour section visibility controlled from Odoo
        if (section.visible === false) return null;

        const Component = sectionRegistry[section.type];

        if (!Component) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[SectionRenderer] No component for section type "${section.type}".`,
            );
          }
          return null;
        }

        // Apply presentation settings (alignment, theme, variant) via data attrs +
        // utility classes on a wrapper. Components themselves stay untouched.
        const p = section.presentation ?? {};
        const presentationClasses = cmsPresentationClasses(p);
        const dataAttrs = cmsPresentationDataAttrs(p);

        // Strip undefined values so React doesn't set empty attributes
        const cleanDataAttrs = Object.fromEntries(
          Object.entries(dataAttrs).filter(([, v]) => v !== undefined),
        ) as Record<string, string>;

        if (presentationClasses || Object.keys(cleanDataAttrs).length > 0) {
          return (
            <div key={section.id} className={presentationClasses || undefined} {...cleanDataAttrs}>
              <Component data={section.data} />
            </div>
          );
        }

        return <Component key={section.id} data={section.data} />;
      })}
    </>
  );
}

/**
 * Register additional section types at runtime.
 * Use when adding custom section components beyond the built-in set.
 */
export function registerSectionType(
  type: string,
  component: ComponentType<SectionComponentProps>,
): void {
  (sectionRegistry as Record<string, ComponentType<SectionComponentProps>>)[
    type
  ] = component;
}

export { sectionRegistry };
