import { SOFTWARE_FULL_CATALOG } from "@/data/software-full-catalog";

const LOCAL = "/images/brands";

/**
 * Brand marks for the brands explorer + software hero.
 * Local assets for now — send correct software logos one by one to replace these.
 */
const BRAND_LOGO_BY_ID: Record<string, string> = {
  autodesk: `${LOCAL}/autodesk-wordmark.svg`,
  adobe: `${LOCAL}/adobe.svg`,
  microsoft: `${LOCAL}/microsoft.svg`,
  oracle: `${LOCAL}/oracle.svg`,
  costx: `${LOCAL}/costx.png`,
  cubicost: `${LOCAL}/cubicost.png`,
  planswift: `${LOCAL}/planswift.png`,
  spectronova: `${LOCAL}/spectronova.png`,
  csi: `${LOCAL}/csi.png`,
  bentley: `${LOCAL}/bentley.png`,
  turnitin: `${LOCAL}/turnitin.png`,
  mathwork: `${LOCAL}/mathworks.png`,
  nitro: `${LOCAL}/nitro.png`,
  fortinet: `${LOCAL}/fortinet.svg`,
  sophos: `${LOCAL}/sophos.png`,
  kaspersky: `${LOCAL}/kaspersky.svg`,
  symantec: `${LOCAL}/symantec.svg`,
  "palo-alto": `${LOCAL}/paloalto.svg`,
  redhat: `${LOCAL}/redhat.svg`,
  etap: `${LOCAL}/etap2.png`,
  prokon: `${LOCAL}/prokon.png`,
  lumion: `${LOCAL}/lumion.png`,
  "v-ray": `${LOCAL}/vray.png`,
  sketchup: `${LOCAL}/sketchup.svg`,
  bluebeam: `${LOCAL}/bluebeam.png`,
  twinmotion: `${LOCAL}/twinmotion.svg`,
  solidworks: `${LOCAL}/solidworks.png`,
  spss: `${LOCAL}/ibm.svg`,
  corona: `${LOCAL}/corona.png`,
  "d5-render": `${LOCAL}/d5.png`,
  quorum: `${LOCAL}/quorum.png`,
  cype: `${LOCAL}/cype.png`,
  sap2000: `${LOCAL}/sap2000.png`,
  etabs: `${LOCAL}/etabs.png`,
  safe: `${LOCAL}/safe.png`,
  bitdefender: `${LOCAL}/bitdefender.png`,
  "trend-micro": `${LOCAL}/trend-micro.png`,
  acronis: `${LOCAL}/acronis.png`,
};

export type SoftwareBrandLogoItem = {
  id: string;
  label: string;
  logoSrc: string | null;
};

export const SOFTWARE_BRAND_LOGO_ITEMS: SoftwareBrandLogoItem[] = SOFTWARE_FULL_CATALOG.map(
  (brand) => ({
    id: brand.id,
    label: brand.label,
    logoSrc: BRAND_LOGO_BY_ID[brand.id] ?? null,
  }),
);

export function softwareBrandLogoSrc(brandId: string): string | null {
  return BRAND_LOGO_BY_ID[brandId] ?? null;
}
