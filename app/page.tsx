import { SectionRenderer } from "@/components/sections";
import { Loading } from "@/components/ui";
import { getHomePage } from "@/data";
import "@/styles/pages/home.css";
import { buildPageMetadata } from "@/lib/utils";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomePage();
  if (!page) return { title: "Home" };
  return buildPageMetadata(page);
}

export default async function HomePage() {
  const page = await getHomePage();

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
      <SectionRenderer sections={page.sections} />
    </Suspense>
  );
}
