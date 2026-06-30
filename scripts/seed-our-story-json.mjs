/**
 * Seed /our-story page sections in Odoo (website 7) — matches aptusinfotech.com/our-story
 * Usage: node --env-file=.env.local scripts/seed-our-story-json.mjs
 */

const BASE = (process.env.ODOO_URL ?? "").replace(/\/$/, "");
const DB = process.env.ODOO_DB ?? "";
const USER = process.env.ODOO_USER ?? "";
const KEY = process.env.ODOO_API_KEY ?? "";
const FIELD = process.env.ODOO_CMS_PAGE_JSON_FIELD?.trim() || "x_page_sections_json";
const PAGE_ID = 249;
const IMG = "https://aptusinfotech.com/wp-content/uploads/2025/05";

const STORY_INTRO =
  "Aptus Infotech is the premier System Integrator & Software Consultant providing consulting services, training, To the large and medium businesses. Our experience of working with different domains has given us extensive industry insight and helped us in mastering our competencies. We do a comprehensive analysis of your industry- its size, tasks you want to carry out, your challenges and subsequently map out a plan by recommending new elements to provide the right solutions that are cost effective and correspond to your business goals and IT strategy. We help streamline your business operations with wisely considered software solutions.";

const partnerLogos = [
  "APC", "Vertiv", "Norden", "Norden-2", "Suprema", "Tyco",
  "FERMAX-1", "Microsens", "LS-Cables", "Logitech", "Honeywell", "Hikvision",
  "Fanvil", "FAAC", "Extron", "EATON", "BFT", "ZKTeco",
  "Yealink", "WatchNet", "URMET", "TOA", "Schneider", "PELCO",
  "Panduit", "Nice", "Opterna", "Axis", "Avigilon", "AKCP",
].map((name, i) => ({
  id: `partner-${i}`,
  src: `${IMG}/${name}.png`,
  alt: name.replace(/-/g, " "),
}));

const sections = {
  banner: {
    imageSrc: `${IMG}/about_banner-e1746943143932.jpg`,
    imageAlt: "our-story",
  },
  introRow: {
    title: "Our Pursuit",
    paragraphs: [STORY_INTRO],
    imageSrc: `${IMG}/award.jpg`,
    imageAlt: "Rajesh Malaviya",
  },
  flipCards: {
    spotlight: { title: "We are powered by performance", icon: "info" },
    items: [
      {
        id: "mission",
        title: "Mission",
        icon: "cogs",
        variant: "green",
        description:
          "To provide expert services at fair prices, help you overcome your problems and eliminate the risks involved by providing effective measures and turn your project into success.",
      },
      {
        id: "vision",
        title: "Vision",
        icon: "vision",
        variant: "green",
        description:
          'Our vision is to be recognized & respected in global IT market as a professional solution provider with constant innovation to make "IT" better for its clients by being their strategic business partner.',
      },
    ],
  },
  partnerships: {
    heading: "Winning together with",
    headingAccent: "Strategic Alliances",
    logos: partnerLogos,
  },
  contactCta: {
    heading: "Have questions? We can help",
    description:
      "Speak with our team about software, ELV, or IT solutions tailored to your business in Oman.",
    actionLabel: "Contact Us",
    actionHref: "/contact-us",
  },
};

let id = 0;
async function rpc(service, method, args) {
  const res = await fetch(`${BASE}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "call", params: { service, method, args } }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data?.message ?? json.error.message);
  return json.result;
}

const uid = await rpc("common", "authenticate", [DB, USER, KEY, {}]);
if (!uid) throw new Error("Odoo auth failed");

await rpc("object", "execute_kw", [
  DB,
  uid,
  KEY,
  "website.page",
  "write",
  [[PAGE_ID], { [FIELD]: JSON.stringify(sections, null, 2), is_published: true, website_published: true }],
]);

console.log(`Seeded ${FIELD} on website.page id=${PAGE_ID} (/our-story)`);
console.log("Test: http://localhost:3004/our-story");
