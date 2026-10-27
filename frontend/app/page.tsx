import { SectionRenderer } from "@/components/sections";
import { Loading } from "@/components/ui";
import { getHomePage } from "@/data";
import { localizePage } from "@/lib/localize-page";
import { getRequestLocale } from "@/lib/request-locale";
import { getMessages } from "@/locales/messages";
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
  const locale = await getRequestLocale();
  let page = null;
  try {
    const raw = await getHomePage();
    page = raw ? await localizePage(raw, locale) : null;
  } catch (err) {
    console.warn(
      "[home] CMS unavailable — showing empty state.",
      err instanceof Error ? err.message : err,
    );
  }

  if (!page) {
    return (
      <div className="section-padding">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-muted-foreground">{getMessages(locale).emptyCms}</p>
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
