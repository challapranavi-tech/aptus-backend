import { SectionRenderer } from "@/components/sections";
import { Loading } from "@/components/ui";
import { getHomePage } from "@/data";
import "@/styles/pages/home.css";
import { buildPageMetadata } from "@/lib/utils";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getHomePage();
    if (!page) return { title: "Home" };
    return buildPageMetadata(page);
  } catch {
    return { title: "Home" };
  }
}

export default async function HomePage() {
  let page = null;
  try {
    page = await getHomePage();
  } catch (err) {
    console.error(err);
  }

  if (!page) {
    return (
      <div className="section-padding">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-muted-foreground">
            No page content configured. Connect Odoo CMS to populate this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading fullScreen />}>
      <div className="page-home">
        <SectionRenderer sections={page.sections} />
      </div>
    </Suspense>
  );
}
