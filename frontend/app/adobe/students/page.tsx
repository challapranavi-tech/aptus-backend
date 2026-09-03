import { AdobeDestinationView } from "@/components/adobe/destinations/AdobeDestinationView";
import { ADOBE_DESTINATIONS } from "@/components/adobe/destinations/content";
import type { Metadata } from "next";

const config = ADOBE_DESTINATIONS.students;

export const metadata: Metadata = config.metadata;

export default function AdobeStudentsPage() {
  return <AdobeDestinationView config={config} />;
}
