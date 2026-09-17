/**
 * Our Story from committed frontend/content/our-story.json.
 *
 * Vercel root deploy only builds the frontend; `/our-story` used to fetch
 * sections from the separate backend API (often still on old Odoo JSON).
 * Shipping our-story.json with the frontend makes the redesign visible on
 * frontend deploy — same pattern as home.json / case-studies.json.
 */

import type { OurStory, OurStoryTone, Page } from "@/types";
import ourStoryJson from "@/content/our-story.json";

type RawStory = typeof ourStoryJson;

function asTone(value: string | undefined): OurStoryTone | undefined {
  if (value === "navy" || value === "sky" || value === "green") return value;
  return undefined;
}

export function buildLocalOurStoryPage(): Page | null {
  const raw = ourStoryJson as RawStory;
  const hero = raw.storyHero;
  const journey = raw.storyJourney;
  const highlights = raw.storyHighlights;
  if (!hero && !journey && !highlights) return null;

  const data: OurStory = {
    type: "our-story",
    hero: hero
      ? {
          titleBefore: hero.titleBefore,
          titleAccent: hero.titleAccent,
          description: hero.description,
          images: hero.images?.map((img) => ({
            src: img.src,
            alt: img.alt ?? "",
          })),
          values: hero.values?.map((value) => ({
            id: value.id,
            title: value.title,
            description: value.description,
            icon: value.icon,
            tone: asTone(value.tone),
          })),
        }
      : undefined,
    journey: journey
      ? {
          originParagraphs: journey.originParagraphs,
          today: journey.today,
          milestones: journey.milestones?.map((item) => ({
            id: item.id,
            year: item.year,
            title: item.title,
            description: item.description,
            tone: asTone(item.tone),
          })),
        }
      : undefined,
    highlights: highlights?.items?.length
      ? {
          items: highlights.items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            icon: item.icon,
          })),
        }
      : undefined,
  };

  return {
    id: "local:our-story",
    slug: "our-story",
    title: "Our Story",
    seo: {
      title: "Our Story | Aptus Infotech",
      description:
        "For over 25 years Aptus Infotech has empowered businesses in Oman with software, ELV, and integrated technology solutions.",
    },
    sections: [
      {
        id: "our-story",
        type: "our-story",
        order: 1,
        data,
      },
    ],
  };
}
