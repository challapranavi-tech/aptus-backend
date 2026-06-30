/**
 * Seed homepage page (ODOO_CMS_HOME_PAGE_ID) with default section JSON.
 * Usage: node scripts/seed-homepage-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_HOMEPAGE_JSON_FIELD?.trim() || "x_homepage_sections_json";
const PAGE_ID = Number(process.env.ODOO_CMS_HOME_PAGE_ID || 226);

/** Default sections payload — keep in sync with src/lib/cms/homepage-content.ts */
const SECTIONS_JSON = {
  hero: {
    id: "hero",
    visible: true,
    imageSrc: "/images/25-years-1024x256.png",
    imageAlt: "Aptus Infotech 25 Years",
    imageWidth: 1024,
    imageHeight: 256,
  },
  features: [
    {
      id: "elv",
      visible: true,
      eyebrow: "ELV & Security",
      title: { before: "Aptus Infotech's comprehensive", accent: "ELV & Security" },
      description:
        "These systems are designed to meet the present needs of the customers as well as scalable for future demands and to keep at par with the evolving technology.",
      imageSrc: "/images/Aptusinfo.jpg",
      imageAlt: "Aptus Infotech ELV and Security",
      href: "/elv-solutions",
      imagePosition: "left",
      background: "white",
    },
    {
      id: "software",
      visible: true,
      eyebrow: "Software",
      title: { before: "Aptus Infotech's Value Added", accent: "Software Services" },
      description:
        "Witness the most professional ICT and Engineering Services for clients across all sectors. We also help clients to make the move from CAD to BIM.",
      imageSrc: "/images/fdsg-1.jpg",
      imageAlt: "Aptus Infotech Software Services",
      href: "/software",
      imagePosition: "right",
      background: "muted",
    },
  ],
  services: {
    id: "services",
    visible: true,
    eyebrow: "SERVICES",
    title: { before: "We Provide Industry Demand", accent: "Services" },
    items: [
      {
        title: "ELV Solutions",
        description:
          "We have a proficient team in supplying, installing and commissioning a range of ELV and security systems.",
        icon: "lightbulb",
        hoverImageSrc:
          "https://aptusinfotech.com/wp-content/uploads/2025/05/Home-Automation.webp",
      },
      {
        title: "Software Related Training",
        description:
          "Mentors who are IT experts providing training that is in sync with the industry expectations.",
        icon: "cog",
        hoverImageSrc:
          "https://aptusinfotech.com/wp-content/uploads/2025/05/Home-Automation.webp",
      },
      {
        title: "Building Information Modelling",
        description:
          "Helping clients to make the move from CAD to BIM with robust software solutions and training.",
        icon: "bim",
        hoverImageSrc:
          "https://aptusinfotech.com/wp-content/uploads/2025/05/Home-Automation.webp",
      },
    ],
  },
  keyEnablers: {
    id: "key-enablers",
    visible: true,
    eyebrow: "Key Enablers",
    title: { before: "We Provide Industry Demand", accent: "Services" },
    subtitle: "To Do Business In A Better Way And Provide Quintessential Services",
    items: [
      {
        number: "01",
        title: "Differentiated Client Engagement",
        description: "Differentiated at the Front through industry and client insight",
      },
      {
        number: "02",
        title: "Deep Industy Insights",
        description: "Uncovering Key characterstics of industries and offering unique solutions",
      },
      {
        number: "03",
        title: "Standardization Of Delivery",
        description: "Delivery models targeting faster efficient and business aligned KPI's",
      },
      {
        number: "04",
        title: "Strategic Partnerships",
        description:
          "360 deg relationship; collaborative offerings, innovation with product partner and investment in next gen technologies",
      },
      {
        number: "05",
        title: "Culture",
        description: "Collaboration with customers; employees and partners",
      },
    ],
  },
  testimonial: {
    id: "testimonial",
    visible: true,
    quote:
      "We would like to acknowledge and extend my heartfelt gratitude to Aptus Infotech for done an IT project in our Indian School Wadi Kabir international. We appreciate the commitment & dedication shown by Aptus Infotech for their implementation and services. We also admire about their aspiration for their prompt and flawless support from project team. We look forward for continual long-term association with Aptus Infotech",
    authorName: "Nambi Rajesh",
    authorTitle: "IT Manager, Indian School Wadi Kabir International",
    authorImageSrc: "/images/logotest.png",
    backgroundImageSrc:
      "https://aptusinfotech.com/wp-content/uploads/2025/05/Screenshot-2021-03-10-112925-e1621242309273-1.png",
  },
};

async function odooCall(model, method, body) {
  const baseUrl = (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ODOO_API_KEY ?? ""}`,
      "Content-Type": "application/json",
      "X-Odoo-Database": process.env.ODOO_DB ?? "",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

const jsonString = JSON.stringify(SECTIONS_JSON, null, 2);

await odooCall("website.page", "write", {
  ids: [PAGE_ID],
  vals: { [FIELD_NAME]: jsonString },
});

console.log(`Seeded ${FIELD_NAME} on website.page id=${PAGE_ID}`);
console.log(`JSON size: ${jsonString.length} chars`);
console.log("\nEdit this field in Odoo: Website → Pages → Home → Homepage Sections JSON");
console.log("Then refresh http://localhost:3000/ to see changes.");
