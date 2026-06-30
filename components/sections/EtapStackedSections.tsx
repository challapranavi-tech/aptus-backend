import { SoftwareSubNav } from "@/components/layout/SoftwareSubNav";
import { softwareSubnavForFamily } from "@/data/software-subnav";
import type { FeatureRow as FeatureRowData, Section, SoftwareInnerHero as SoftwareInnerHeroData } from "@/types";
import { Banner } from "./Banner";
import { CTA } from "./CTA";
import { FeatureRow } from "./FeatureRow";
import { Features } from "./Features";
import { LogoGrid } from "./LogoGrid";

interface EtapStackedSectionsProps {
  sections: Section[];
}

function isWhyChooseRow(section: Section): boolean {
  if (section.type !== "feature-row") return false;
  const heading = (section.data as FeatureRowData).heading;
  return !!heading?.toLowerCase().includes("why choose");
}

/** Live post-2688: intro rows, icon pillars, then Why Choose — not mapper order. */
function etapStackSections(sections: Section[]): Section[] {
  const stack = sections.filter((s) => s.type === "feature-row" || s.type === "features");
  return [
    ...stack.filter((s) => s.type === "feature-row" && !isWhyChooseRow(s)),
    ...stack.filter((s) => s.type === "features"),
    ...stack.filter((s) => s.type === "feature-row" && isWhyChooseRow(s)),
  ];
}

/** Live post-2688: banner, then 25% nav | 75% stacked content, then alliances + form full width. */
export function EtapStackedSections({ sections }: EtapStackedSectionsProps) {
  const sorted = [...sections]
    .filter((s) => s.visible !== false)
    .sort((a, b) => a.order - b.order);

  const banner = sorted.find((s) => s.type === "banner");
  const hero = sorted.find((s) => s.type === "software-inner-hero");
  const stack = etapStackSections(sorted);
  const tail = sorted.filter((s) => s.type === "logo-grid" || s.type === "cta");

  const heroData = hero?.data as SoftwareInnerHeroData | undefined;
  const subnav = softwareSubnavForFamily(heroData?.family);

  return (
    <>
      {banner && <Banner data={banner.data} />}

      <div className="aptus-etap-body">
        <div className="aptus-live-container">
          <div className="aptus-etap-grid">
            <aside className="aptus-etap-nav">
              {subnav && <SoftwareSubNav links={subnav} label="Electrical Software" />}
            </aside>

            <div className="aptus-etap-stack">
              {heroData?.title && (
                <h1 className="aptus-etap-page-title">{heroData.title}</h1>
              )}
              {stack.map((section) => {
                if (section.type === "feature-row") {
                  return <FeatureRow key={section.id} data={section.data} />;
                }
                if (section.type === "features") {
                  return <Features key={section.id} data={section.data} />;
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {tail.map((section) => {
        if (section.type === "logo-grid") {
          return <LogoGrid key={section.id} data={section.data} />;
        }
        if (section.type === "cta") {
          return <CTA key={section.id} data={section.data} />;
        }
        return null;
      })}
    </>
  );
}
