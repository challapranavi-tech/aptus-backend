"use client";

import { cn } from "@/lib/utils";
import type {
  LegalPolicies as LegalPoliciesData,
  LegalPolicyBlock,
  LegalPolicySection,
} from "@/types";
import { useEffect, useMemo, useState } from "react";

interface LegalPoliciesProps {
  data: LegalPoliciesData;
}

function PolicyContent({
  block,
  headingLevel = "h2",
  showTitle = true,
}: {
  block: LegalPolicyBlock;
  headingLevel?: "h2" | "h3";
  showTitle?: boolean;
}) {
  const Heading = headingLevel;
  const headingId = block.id ? `legal-section-${block.id}` : undefined;

  return (
    <div className="aptus-legal__block">
      {showTitle && block.title ? (
        <Heading id={headingId} className={headingLevel === "h2" ? "aptus-legal__heading" : "aptus-legal__subheading"}>
          {block.number ? `${block.number}. ` : ""}
          {block.title}
        </Heading>
      ) : null}

      {block.paragraphs?.map((paragraph, index) => (
        <p key={`${headingId ?? "p"}-${index}`} className="aptus-legal__p">
          {paragraph}
        </p>
      ))}

      {block.bullets?.length ? (
        <ul className="aptus-legal__list">
          {block.bullets.map((item, index) => (
            <li key={`${headingId ?? "b"}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}

      {block.numberedList?.length ? (
        <ol className="aptus-legal__list aptus-legal__list--numbered">
          {block.numberedList.map((item, index) => (
            <li key={`${headingId ?? "n"}-${index}`}>{item}</li>
          ))}
        </ol>
      ) : null}

      {block.closingParagraphs?.map((paragraph, index) => (
        <p key={`${headingId ?? "c"}-${index}`} className="aptus-legal__p">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function LegalPolicies({ data }: LegalPoliciesProps) {
  const sections = useMemo(() => data.sections ?? [], [data.sections]);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && sections.some((section) => section.id === hash)) {
      setActiveId(hash);
      document.getElementById(`legal-section-${hash}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [sections]);

  useEffect(() => {
    if (!sections.length) return;

    const nodes = sections
      .map((section) => document.getElementById(`legal-section-${section.id}`))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id.replace(/^legal-section-/, "");
        if (top) setActiveId(top);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  function selectSection(id: string) {
    setActiveId(id);
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.replaceState(null, "", url);
    document.getElementById(`legal-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!sections.length) return null;

  const overview = sections.find((section) => section.id === "overview");
  const bodySections = sections.filter((section) => section.id !== "overview");

  return (
    <article className="aptus-legal" data-section="legal-policies">
      <div className="aptus-legal__layout">
        <nav className="aptus-legal__nav" aria-label="Our Policies & Terms">
          <p className="aptus-legal__nav-label">{data.title}</p>
          <ul className="aptus-legal__nav-list">
            {sections.map((section) => {
              const selected = section.id === activeId;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    className={cn("aptus-legal__nav-link", selected && "is-active")}
                    aria-current={selected ? "true" : undefined}
                    onClick={() => selectSection(section.id)}
                  >
                    <span className="aptus-legal__nav-dot" aria-hidden="true" />
                    {section.number ? `${section.number}. ` : ""}
                    {section.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="aptus-legal__main">
          <header className="aptus-legal__hero">
            <h1 className="aptus-legal__title">{data.title}</h1>
          </header>

          {overview ? (
            <section
              id={`legal-section-${overview.id}`}
              className="aptus-legal__section"
              aria-label={overview.title}
            >
              <PolicyContent block={{ ...overview, title: undefined }} showTitle={false} />
            </section>
          ) : null}

          {bodySections.map((section) => (
            <section
              key={section.id}
              id={`legal-section-${section.id}`}
              className="aptus-legal__section"
              aria-labelledby={`legal-heading-${section.id}`}
            >
              <h2 id={`legal-heading-${section.id}`} className="aptus-legal__heading">
                {section.number ? `${section.number}. ` : ""}
                {section.title}
              </h2>
              <PolicyContent block={{ ...section, id: undefined, title: undefined }} showTitle={false} />
              {section.subsections?.map((sub) => (
                <PolicyContent key={sub.id ?? sub.title} block={sub} headingLevel="h3" />
              ))}
            </section>
          ))}

          {data.footerNote ? <p className="aptus-legal__footer">{data.footerNote}</p> : null}
        </div>
      </div>
    </article>
  );
}

export type { LegalPolicySection };
