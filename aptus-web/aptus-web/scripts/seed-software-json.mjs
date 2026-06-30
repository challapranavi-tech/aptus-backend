/**
 * Seed Software page (/software-solutions in Odoo) with default section JSON.
 * Usage: node scripts/seed-software-json.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const FIELD_NAME = process.env.ODOO_CMS_SOFTWARE_JSON_FIELD?.trim() || "x_software_sections_json";
const PAGE_URL = process.env.ODOO_CMS_SOFTWARE_PAGE_URL?.trim() || "/software-solutions";
const PINNED_PAGE_ID = Number(process.env.ODOO_CMS_SOFTWARE_PAGE_ID || 0);
const WEBSITE_ID = Number(process.env.ODOO_CMS_WEBSITE_ID || 0);

/** Keep in sync with src/lib/cms/software-content.ts */
const SECTIONS_JSON = {
  hero: {
    id: "hero",
    visible: true,
    title: { before: "Premium Software Solutions for", accent: "Modern Businesses" },
    subtitle:
      "Empowering businesses with cutting-edge software solutions from industry-leading brands.",
    ctaLabel: "Request a Quote",
    ctaHref: "mailto:info@aptusinfotech.com",
  },
  intro: {
    id: "intro",
    visible: true,
    eyebrow: "Software",
    title: { before: "Your Premier", accent: "Software Solutions", after: "Provider" },
    paragraphs: [
      "Aptus Infotech is a leading provider of premium software solutions designed to help businesses streamline operations, enhance productivity, and drive growth. With over 25 years of experience in the IT industry, we have successfully delivered cutting-edge software solutions to clients across various sectors.",
      "As an authorized partner of industry-leading software brands, we offer genuine licenses, expert implementation, and comprehensive support for all our software solutions.",
    ],
  },
  categories: {
    id: "categories",
    visible: true,
    eyebrow: "Portfolio",
    title: { before: "Our", accent: "Software Solutions" },
    subtitle: "Premium software solutions from industry-leading brands",
    items: [
      {
        title: "Autodesk",
        description:
          "Comprehensive design and engineering software for architecture, engineering, and construction professionals.",
      },
      {
        title: "Electrical Software",
        description:
          "Specialized software for electrical design, analysis, and documentation of electrical systems.",
      },
      {
        title: "Adobe",
        description:
          "Creative Cloud software for graphic design, video editing, web development, and photography.",
      },
      {
        title: "Oracle",
        description:
          "Database management and enterprise software solutions to manage and analyze critical business data.",
      },
      {
        title: "Microsoft",
        description:
          "Productivity and business software including Office 365, Windows Server, and Azure cloud services.",
      },
      {
        title: "Multimedia",
        description:
          "Professional multimedia software for video editing, animation, and visual effects creation.",
      },
      {
        title: "Quantity Takeoff",
        description:
          "Specialized software for construction cost estimation and material quantity calculation.",
      },
      {
        title: "Structural Software",
        description:
          "Advanced software for structural analysis, design, and documentation of building structures.",
      },
      {
        title: "Cyber Security Solutions",
        description:
          "Comprehensive security software to protect your digital assets from cyber threats and vulnerabilities.",
      },
      {
        title: "Educational Software",
        description:
          "Innovative software solutions for educational institutions to enhance teaching and learning experiences.",
      },
      {
        title: "Educational Documents Management",
        description:
          "Document management systems designed specifically for educational institutions to handle academic records.",
      },
    ],
  },
  process: {
    id: "process",
    visible: true,
    eyebrow: "Process",
    title: { before: "How we deliver", accent: "exceptional solutions" },
    items: [
      {
        step: "1",
        title: "Consultation",
        description:
          "We analyze your business needs and objectives to recommend the most suitable software solutions.",
      },
      {
        step: "2",
        title: "Licensing",
        description:
          "We help you procure the appropriate licenses at competitive prices with flexible options.",
      },
      {
        step: "3",
        title: "Implementation",
        description:
          "Our technical team ensures smooth installation and integration with your existing systems.",
      },
      {
        step: "4",
        title: "Training",
        description:
          "We provide comprehensive training to ensure your team can effectively use the software.",
      },
      {
        step: "5",
        title: "Support",
        description:
          "Our support team is always available to assist with any issues or questions.",
      },
    ],
  },
  whyChoose: {
    id: "whyChoose",
    visible: true,
    eyebrow: "Why Aptus",
    title: { before: "Why Choose", accent: "Aptus Infotech" },
    items: [
      {
        title: "Authorized Partners",
        description:
          "We are authorized partners of all software brands we offer, ensuring genuine licenses and manufacturer support.",
      },
      {
        title: "Expert Consultation",
        description:
          "Our certified consultants provide expert advice to help you select the right software for your specific needs.",
      },
      {
        title: "Implementation Support",
        description:
          "We provide comprehensive implementation services to ensure smooth integration with your existing systems.",
      },
      {
        title: "Training & Support",
        description:
          "Our training programs ensure your team can effectively use the software, with ongoing support when needed.",
      },
    ],
  },
  showContactCta: true,
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

async function resolvePageId() {
  if (PINNED_PAGE_ID > 0) return PINNED_PAGE_ID;

  const domain = [["url", "=", PAGE_URL]];
  if (WEBSITE_ID > 0) domain.push(["website_id", "=", WEBSITE_ID]);

  const rows = await odooCall("website.page", "search_read", {
    domain,
    fields: ["id", "name", "url", "website_id"],
    limit: 5,
  });

  if (!rows.length) {
    throw new Error(`No website.page found for url=${PAGE_URL} (website_id=${WEBSITE_ID || "any"})`);
  }

  return rows[0].id;
}

const pageId = await resolvePageId();
const jsonString = JSON.stringify(SECTIONS_JSON, null, 2);

await odooCall("website.page", "write", {
  ids: [pageId],
  vals: { [FIELD_NAME]: jsonString },
});

console.log(`Seeded ${FIELD_NAME} on website.page id=${pageId} (${PAGE_URL})`);
console.log(`JSON size: ${jsonString.length} chars`);
console.log("\nAdd field to Odoo form via Studio: Software Page Sections JSON (Next.js)");
console.log("Then refresh http://localhost:3000/software");
