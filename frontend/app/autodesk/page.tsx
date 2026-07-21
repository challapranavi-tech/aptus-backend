import { AutodeskPageView } from "@/components/autodesk";
import type { Metadata } from "next";
import "@/styles/autodesk/fonts.css";

export const metadata: Metadata = {
  title: "Autodesk",
  description:
    "Explore Autodesk design and make software — AutoCAD, Revit, Fusion, Maya, and more. Aptus Infotech is your trusted Autodesk partner.",
};

/**
 * Dedicated /autodesk route — takes precedence over [slug] CMS hub.
 * Header/Footer from root layout; replica has no Autodesk chrome.
 */
export default function AutodeskPage() {
  return <AutodeskPageView />;
}
