/**
 * Our Team from committed frontend/content/our-team.json.
 * Ships on frontend Vercel deploy — same pattern as home / our-story.
 */

import type { Page, Section } from "@/types";
import ourTeamJson from "@/content/our-team.json";

type RawTitle = { before?: string; accent?: string; after?: string };
type ImagePosition = "left" | "right" | "below" | "above";

function joinTitle(t?: RawTitle): string | undefined {
  if (!t) return undefined;
  return [t.before, t.accent, t.after].filter(Boolean).join(" ").trim() || undefined;
}

function asImagePosition(value: string | undefined): ImagePosition | undefined {
  if (value === "left" || value === "right" || value === "below" || value === "above") {
    return value;
  }
  return undefined;
}

export function buildLocalOurTeamPage(): Page | null {
  const raw = ourTeamJson;
  const sections: Section[] = [];
  let order = 0;

  const culture = raw.text?.visible === false ? undefined : raw.text;
  if (culture) {
    sections.push({
      id: "page-team-culture",
      type: "rich-text",
      order: ++order,
      data: {
        type: "rich-text",
        eyebrow: culture.eyebrow,
        heading: culture.title?.before,
        headingAccent: culture.title?.accent,
        items: culture.items?.map((item) => ({
          title: item.title,
          description: item.description,
        })),
        media: culture.imageSrc
          ? { src: culture.imageSrc, alt: culture.imageAlt ?? "" }
          : undefined,
        imagePosition: asImagePosition(culture.imagePosition),
        variant: "culture-panel",
        background: "white",
      },
    });
  }

  const team = raw.team?.visible === false ? undefined : raw.team;
  if (team?.members?.length) {
    sections.push({
      id: "page-team",
      type: "team",
      order: ++order,
      data: {
        type: "team",
        heading: joinTitle(team.title),
        variant: "leadership",
        members: team.members.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          bio: member.bio,
          avatar: member.imageSrc
            ? { src: member.imageSrc, alt: member.imageAlt ?? member.name }
            : undefined,
        })),
      },
    });
  }

  const join = raw.join?.visible === false ? undefined : raw.join;
  if (join) {
    sections.push({
      id: "page-join-team",
      type: "rich-text",
      order: ++order,
      data: {
        type: "rich-text",
        heading: join.title?.before ?? "Join",
        headingAccent: join.title?.accent ?? "Our Team",
        subheading: join.subheading,
        paragraphs: join.paragraphs,
        variant: "join-panel",
        action:
          join.actionLabel && join.actionHref
            ? { label: join.actionLabel, href: join.actionHref }
            : undefined,
      },
    });
  }

  if (!sections.length) return null;

  return {
    id: "local:our-team",
    slug: "our-team",
    title: "Our Team",
    seo: {
      title: "Our Team | Aptus Infotech",
      description:
        "Meet the Aptus Infotech team in Oman — people first, then the management who lead the business.",
    },
    sections,
  };
}
