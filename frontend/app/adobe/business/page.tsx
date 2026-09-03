import { AdobeDestinationView } from "@/components/adobe/destinations/AdobeDestinationView";
import { ADOBE_DESTINATIONS } from "@/components/adobe/destinations/content";
import type { Metadata } from "next";

const config = ADOBE_DESTINATIONS.business;

export const metadata: Metadata = config.metadata;

export default function AdobeBusinessPage() {
  return <AdobeDestinationView config={config} />;
}
