import { SoftwareSubNav } from "@/components/layout/SoftwareSubNav";
import { softwareSubnavForFamily } from "@/data/software-subnav";
import type {
  Banner as BannerData,
  CTA as CTAData,
  FeatureRow as FeatureRowData,
  Features as FeaturesData,
  LogoGrid as LogoGridData,
  Section,
  SoftwareInnerHero as SoftwareInnerHeroData,
} from "@/types";
import { Banner } from "./Banner";
import { CTA } from "./CTA";
import { FeatureRow } from "./FeatureRow";
import { Features } from "./Features";
import { LogoGrid } from "./LogoGrid";

interface SoftwareStackedSectionsProps {
  sections: Section[];
}

function subnavLabel(family?: string): string {
  if (family === "elv") return "ELV Solutions";
  if (family === "educational") return "Electrical Software";
  if (family === "microsoft") return "Microsoft products";
  return `${family ?? "Software"} products`;
}

function isWhyChooseSection(section: Section): boolean {
  if (section.type === "feature-row") {
    const heading = (section.data as FeatureRowData).heading;
    return !!heading?.toLowerCase().includes("why choose");
  }
  if (section.type === "features") {
    const anchor = section.data.type === "features" ? section.data.anchorId : undefined;
    const heading = section.data.type === "features" ? section.data.heading : undefined;
    return anchor === "why-aptus" || anchor === "why-choose" || !!heading?.toLowerCase().includes("why choose");
  }
  return false;
}

/** Live ETAP / Microsoft inner pages: banner, 25% nav | 75% stacked content, then alliances + form. */
function stackContentSections(sections: Section[]): Section[] {
  const stack = sections.filter((s) => s.type === "feature-row" || s.type === "features");
  return [
    ...stack.filter((s) => !isWhyChooseSection(s)),
    ...stack.filter((s) => isWhyChooseSection(s)),
  ];
}

function introFromHero(hero: SoftwareInnerHeroData): FeatureRowData | null {
  const heading = hero.bannerTagline ?? hero.title;
  if (!heading && !hero.paragraphs?.length && !hero.media) return null;

  return {
    type: "feature-row",
    heading,
    paragraphs: hero.paragraphs,
    media: hero.media,
    imagePosition: "below",
    variant: "panel",
    action: hero.action,
  };
}

export function SoftwareStackedSections({ sections }: SoftwareStackedSectionsProps) {
  const sorted = [...sections]
    .filter((s) => s.visible !== false)
    .sort((a, b) => a.order - b.order);

  const banner = sorted.find((s) => s.type === "banner");
  const hero = sorted.find((s) => s.type === "software-inner-hero");
  const stack = stackContentSections(sorted);
  const tail = sorted.filter((s) => s.type === "logo-grid" || s.type === "cta");

  const heroData = hero?.data as SoftwareInnerHeroData | undefined;
  const subnav = softwareSubnavForFamily(heroData?.family);
  const intro = heroData ? introFromHero(heroData) : null;
  const pageTitle = heroData?.pageTitle ?? heroData?.bannerTitle ?? heroData?.title;

  return (
    <>
      {banner?.data.type === "banner" && <Banner data={banner.data as BannerData} />}

      <div className="aptus-etap-body">
        <div className="aptus-live-container">
          <div className="aptus-etap-grid">
            <aside className="aptus-etap-nav">
              {subnav && <SoftwareSubNav links={subnav} label={subnavLabel(heroData?.family)} />}
            </aside>

            <div className="aptus-etap-stack aptus-software-stack">
              {pageTitle && <h1 className="aptus-etap-page-title">{pageTitle}</h1>}
              {intro && <FeatureRow data={intro} />}
              {stack.map((section) => {
                if (section.type === "feature-row") {
                  return <FeatureRow key={section.id} data={section.data as FeatureRowData} />;
                }
                if (section.type === "features") {
                  return <Features key={section.id} data={section.data as FeaturesData} />;
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {tail.map((section) => {
        if (section.type === "logo-grid") {
          return <LogoGrid key={section.id} data={section.data as LogoGridData} />;
        }
        if (section.type === "cta") {
          return <CTA key={section.id} data={section.data as CTAData} />;
        }
        return null;
      })}
    </>
  );
}

/** @deprecated use SoftwareStackedSections */
export const EtapStackedSections = SoftwareStackedSections;
