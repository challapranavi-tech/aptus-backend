import { SoftwareSolutionsHero } from "@/components/software/SoftwareSolutionsHero";
import { SoftwareLandingCards } from "@/components/software/SoftwareLandingCards";
import { Features } from "@/components/sections/Features";
import { LogoGrid } from "@/components/sections/LogoGrid";
import { Testimonials } from "@/components/sections/Testimonials";
import {
  SOFTWARE_CHALLENGES,
  SOFTWARE_OUR_PROCESS,
  SOFTWARE_OUR_SOLUTIONS,
  SOFTWARE_PARTNERSHIPS,
  SOFTWARE_TESTIMONIALS,
} from "@/data/software-solutions-page";
import type { Metadata } from "next";
import "@/styles/software-catalog.css";
import "@/styles/software-pages.css";

export const metadata: Metadata = {
  title: "Software Solutions",
  description:
    "Premium software solutions from Autodesk, Adobe, Microsoft, Oracle, and more — with licensing, implementation, and support from Aptus Infotech.",
};

export default function SoftwareSolutionsPage() {
  return (
    <main className="aptus-software-page aptus-software-catalog-page">
      <SoftwareSolutionsHero />
      <LogoGrid data={SOFTWARE_PARTNERSHIPS} />
      <SoftwareLandingCards
        variant="challenges"
        heading={SOFTWARE_CHALLENGES.heading}
        subheading={SOFTWARE_CHALLENGES.subheading}
        items={SOFTWARE_CHALLENGES.items}
      />
      <SoftwareLandingCards
        variant="solutions"
        heading={SOFTWARE_OUR_SOLUTIONS.heading}
        subheading={SOFTWARE_OUR_SOLUTIONS.subheading}
        items={SOFTWARE_OUR_SOLUTIONS.items}
      />
      <Features data={SOFTWARE_OUR_PROCESS} />
      <Testimonials data={SOFTWARE_TESTIMONIALS} marquee />
    </main>
  );
}
