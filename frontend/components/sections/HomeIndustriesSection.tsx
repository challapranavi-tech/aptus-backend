"use client";

import { Container, CmsImage } from "@/components/ui";
import type { Features as FeaturesData } from "@/types";
import Link from "next/link";
import { useMemo, useState } from "react";

type SolutionFilter = "all" | "elv" | "software";

const FILTERS: { id: SolutionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "elv", label: "ELV" },
  { id: "software", label: "Software" },
];

function matchesFilter(
  categories: string[] | undefined,
  filter: SolutionFilter,
): boolean {
  if (filter === "all") return true;
  if (!categories?.length) return true;
  return categories.includes(filter);
}

function industryHref(industry: string, filter: SolutionFilter): string {
  const params = new URLSearchParams();
  params.set("industry", industry);
  if (filter !== "all") params.set("category", filter);
  return `/customer-stories?${params.toString()}`;
}

function storiesHref(baseHref: string | undefined, filter: SolutionFilter): string {
  const href = baseHref || "/customer-stories";
  if (filter === "all") return href;
  const url = new URL(href, "https://aptusinfotech.com");
  url.searchParams.set("category", filter);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export function HomeIndustriesSection({ data }: { data: FeaturesData }) {
  const [filter, setFilter] = useState<SolutionFilter>("all");

  const items = useMemo(
    () =>
      (data.items ?? []).filter((item) =>
        matchesFilter(item.categories, filter),
      ),
    [data.items, filter],
  );

  const tags = useMemo(() => {
    if (data.tagItems?.length) {
      return data.tagItems
        .filter((tag) => matchesFilter(tag.categories, filter))
        .map((tag) => tag.label);
    }
    return data.tags ?? [];
  }, [data.tagItems, data.tags, filter]);

  return (
    <section
      className="home-industries section-padding"
      data-section="features"
      data-variant="home-industries"
    >
      <Container>
        <div className="home-industries__header">
          <div className="home-industries__titles">
            {data.eyebrow && (
              <p className="home-industries__eyebrow">{data.eyebrow}</p>
            )}
            {(data.heading || data.headingAccent) && (
              <h2 className="home-industries__heading">
                {data.heading}
                {data.heading && data.headingAccent ? " " : null}
                {data.headingAccent}
              </h2>
            )}
          </div>

          <div
            className="home-industries__filters"
            role="toolbar"
            aria-label="Filter sectors by solution type"
          >
            {FILTERS.map((option) => {
              const active = option.id === filter;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={
                    active
                      ? "home-industries__filter is-active"
                      : "home-industries__filter"
                  }
                  aria-pressed={active}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {items.length > 0 && (
          <div className="home-industries__grid">
            {items.map((item) => {
              const title = item.title?.trim() || "";
              const card = (
                <>
                  {item.media && (
                    <CmsImage
                      src={item.media.src}
                      alt={item.media.alt || title}
                      width={640}
                      height={480}
                      className="home-industries__image"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                  <div className="home-industries__overlay" aria-hidden="true" />
                  {title ? <h3 className="home-industries__label">{title}</h3> : null}
                </>
              );

              if (!title) {
                return (
                  <article
                    key={item.id}
                    className="feature-card home-industries__card"
                  >
                    {card}
                  </article>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={industryHref(title, filter)}
                  className="feature-card home-industries__card"
                  data-industry={title}
                  aria-label={`View ${title} solutions in action`}
                >
                  {card}
                </Link>
              );
            })}
          </div>
        )}

        {tags.length > 0 && (
          <ul className="home-industries__tags" aria-label="Browse industries">
            {tags.map((tag) => (
              <li key={tag}>
                <Link href={industryHref(tag, filter)} className="home-industries__tag">
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {data.action && (
          <div className="home-industries__more">
            <Link
              href={storiesHref(data.action.href, filter)}
              className="home-industries__more-link"
            >
              {data.action.label}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
