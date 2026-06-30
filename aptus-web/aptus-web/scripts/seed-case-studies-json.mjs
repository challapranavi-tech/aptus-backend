/**
 * Seed Case Studies page (/aptus-case-studies) with default section JSON.
 * Usage: node scripts/seed-case-studies-json.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

loadEnvLocal(ROOT);

const FIELD_NAME =
  process.env.ODOO_CMS_CASE_STUDIES_JSON_FIELD?.trim() || "x_case_studies_sections_json";
const PAGE_URL = process.env.ODOO_CMS_CASE_STUDIES_PAGE_URL?.trim() || "/aptus-case-studies";
const PINNED_PAGE_ID = Number(process.env.ODOO_CMS_CASE_STUDIES_PAGE_ID || 0);
const WEBSITE_ID = Number(process.env.ODOO_CMS_WEBSITE_ID || 0);

const PDF_BASE = "https://aptusinfotech.com/wp-content/uploads/2025/09";

/** Keep in sync with src/lib/cms/case-studies-content.ts */
const SECTIONS_JSON = {
  hero: {
    id: "hero",
    visible: true,
    title: { before: "Aptus Infotech Customer", accent: "Success Stories" },
    subtitle:
      "Showcasing successful projects delivered by Aptus Infotech, highlighting our expertise and innovation.",
  },
  caseStudies: {
    id: "caseStudies",
    visible: true,
    title: { before: "Real Results From", accent: "Real Projects" },
    items: [
      {
        title: "Al Nadha Hospital",
        description:
          "Aptus Infotech engineered a future-proof hospital network at Al Nahda—deploying MICROSENS FTTO switches, secure virtual networks/authentication, and campus-wide fiber—enabling real-time patient data, reliable Wi-Fi, PoE, and scalable, resilient connectivity across critical care and administration departments.",
        pdfHref: `${PDF_BASE}/Al-Nahda-Hospital-Case-Study.pdf`,
        readMoreLabel: "Read More",
      },
      {
        title: "Petroleum Development of Oman",
        description:
          "Aptus Infotech upgraded PDO from AutoCAD 2019 to 2025 for 100 users, delivered training, and implemented Navisworks—accelerating collaboration with AI features and Trace, enabling clash detection, reducing rework, improving takeoffs, and saving time and cost.",
        pdfHref: `${PDF_BASE}/Petroleum-Development-of-Oman-Case-Study.pdf`,
        readMoreLabel: "Read More",
      },
      {
        title: "Royal Oman Police",
        description:
          "Aptus Infotech accelerated ROP’s digital policing by supplying, implementing, and training teams on ETAP electrical digital twin, real-time visualization tools, and Primavera P6—centralizing workflows, boosting collaboration, and enabling secure, data-driven operations across mission-critical projects securely.",
        pdfHref: `${PDF_BASE}/Royal-Oman-Police-Case-Study.pdf`,
        readMoreLabel: "Read More",
      },
      {
        title: "Sultan Haitam City",
        description:
          "Aptus Infotech enabled Sultan Haitham City’s delivery by supplying, implementing, training on Autodesk AEC and BIM Collaborate Pro—deploying a Common Data Environment to centralize data, enable model co-authoring, reduce clashes, cut rework, and accelerate execution.",
        pdfHref: `${PDF_BASE}/Sultan-Haitam-City-Case-Study.pdf`,
        readMoreLabel: "Read More",
      },
    ],
  },
  painPoints: {
    id: "painPoints",
    visible: true,
    title: { before: "Your Building's", accent: "Pain Points, Solved" },
    items: [
      {
        title: "High Energy Costs & Inefficiency",
        description:
          "Legacy systems waste 20-30% of energy. Facility managers struggle to track usage and respond to faults.",
      },
      {
        title: "Security Risks & Compliance Gaps",
        description:
          "Outdated CCTV or fire alarms leave gaps in protection. Non-compliance risks fines and reputational damage.",
      },
      {
        title: "Fragmented Systems & Poor Visibility",
        description:
          "Disjointed ELV/BIM tools make it hard to monitor operations, predict failures, or plan maintenance.",
      },
    ],
    closingParagraph:
      "Aptus Infotech integrates cutting-edge ELV hardware with BIM/Digital Twin software to unify your building’s systems—reducing costs, enhancing security, and future-proofing your investment.",
  },
  whyChoose: {
    id: "whyChoose",
    visible: true,
    eyebrow: "Why Aptus",
    title: { before: "Why Clients Choose", accent: "Aptus Infotech?" },
    items: [
      { title: "Regional Expertise", description: "25+ years serving GCC with local compliance knowledge." },
      { title: "End-to-End Solutions", description: "From design to installation to ongoing support." },
      {
        title: "Technical Rigor",
        description: "Certified engineers (ISO 9001, UL) and tech partnerships.",
      },
      { title: "Proven ROI", description: "90% client retention due to measurable results." },
    ],
  },
  transformCta: {
    id: "transformCta",
    visible: true,
    title: { before: "Ready to Transform", accent: "Your Business?" },
    subtitle:
      "Contact our specialists to discuss how Aptus can resolve the challenges you are facing?",
    ctaLabel: "Get Your Quote Now",
    ctaHref: "mailto:info@aptusinfotech.com",
  },
  testimonials: {
    id: "testimonials",
    visible: true,
    eyebrow: "What Our Clients Say",
    title: { before: "Success stories from businesses using", accent: "AutoCAD through Aptus Infotech" },
    items: [
      {
        quote:
          "Aptus Infotech provided us with AutoCAD licenses and comprehensive training. Their support team helped us streamline our design process, reducing project completion time by 30%.",
        authorName: "Yusuf Al Hashmi",
        authorRole: "Design Manager",
        company: "Construction Company",
      },
      {
        quote:
          "The AutoCAD toolsets from Aptus have revolutionized our workflow. The specialized tools for architecture have significantly improved our productivity and design quality.",
        authorName: "Mariam Al Said",
        authorRole: "Lead Architect",
        company: "Design Firm",
      },
      {
        quote:
          "As a small engineering firm, we needed affordable yet powerful CAD software. Aptus recommended AutoCAD LT, which perfectly meets our needs without breaking the budget.",
        authorName: "Khalid Al Balushi",
        authorRole: "Owner",
        company: "Engineering Consultancy",
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
console.log("\nAdd field to Odoo form via Studio: Case Studies Page Sections JSON (Next.js)");
console.log("Then refresh http://localhost:3000/aptus-case-studies");
