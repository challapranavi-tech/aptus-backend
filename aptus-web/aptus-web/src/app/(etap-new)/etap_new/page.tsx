import type { Metadata } from "next";
import { EtapHomePage } from "@/components/pages/etap-new/EtapHomePage";
import { mapCmsToEtapHome } from "@/components/pages/etap-new/map-cms-to-etap-home";
import { fetchEtapPageContent } from "@/lib/cms/fetch-etap-page-content";
import { ETAP_HOME_ASSETS } from "@/components/pages/etap-new/assets";
import "@/styles/etap-home.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_TITLE = "ETAP | Energy Management Solution | Electrical Digital Twin Platform";
const DEFAULT_DESCRIPTION =
  "ETAP provides market-leading software solutions for electrical systems, from design and engineering to operations and maintenance.";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await fetchEtapPageContent();
  const title = cms.metaTitle ?? DEFAULT_TITLE;
  const description = cms.metaDescription ?? DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ETAP_HOME_ASSETS.heroSlides.bgBanner],
    },
  };
}

export default async function EtapNewRoutePage() {
  const cms = await fetchEtapPageContent();
  const data = mapCmsToEtapHome(cms);

  return <EtapHomePage data={data} />;
}
