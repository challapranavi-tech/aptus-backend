/**
 * Homepage from committed frontend/content/home.json.
 *
 * Vercel root deploy only builds the frontend; `/` used to fetch sections from
 * the separate backend API (often still on old Odoo JSON). Shipping home.json
 * with the frontend makes redesigns visible on frontend deploy.
 */

import { mapHomepageJson } from "@shared/lib/homepage-json";
import type { Page } from "@/types";
import homeJson from "@/content/home.json";

export function buildLocalHomePage(): Page | null {
  const sections = mapHomepageJson(JSON.stringify(homeJson));
  if (!sections?.length) return null;

  return {
    id: "local:home",
    slug: "home",
    title: "Home",
    seo: {
      title: "Home | Aptus Infotech",
      description:
        "Licensed software and ELV delivery from Aptus Infotech — request a quote, receive a quotation, and track status in the portal.",
    },
    sections,
  };
}
