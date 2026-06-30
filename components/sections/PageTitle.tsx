"use client";

import { Container } from "@/components/ui";
import type { PageTitle as PageTitleData } from "@/types";

interface PageTitleProps {
  data: PageTitleData;
}

/** Centered inner-page H1 — live Elementor: 45px / 800 weight / primary blue. */
export function PageTitle({ data }: PageTitleProps) {
  if (!data.title) return null;

  return (
    <section className="bg-white pb-0 pt-16" data-section="page-title">
      <Container>
        <h1 className="aptus-page-heading">{data.title}</h1>
      </Container>
    </section>
  );
}
