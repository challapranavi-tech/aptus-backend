/**
 * Generate all About Us Odoo JSON files into content/odoo-json/
 * Usage: node scripts/generate-about-odoo-json.mjs
 */

import { mkdirSync, writeFileSync } from "fs";
import { contactFormCta, IMG, IMG07, partnerships } from "./about-json-shared.mjs";

const OUT = "content/odoo-json";

const STORY_INTRO =
  "Aptus Infotech is the premier System Integrator & Software Consultant providing consulting services, training, To the large and medium businesses. Our experience of working with different domains has given us extensive industry insight and helped us in mastering our competencies. We do a comprehensive analysis of your industry- its size, tasks you want to carry out, your challenges and subsequently map out a plan by recommending new elements to provide the right solutions that are cost effective and correspond to your business goals and IT strategy. We help streamline your business operations with wisely considered software solutions.";

const PRIVACY =
  "One of the biggest concerns in the present information technology era is protection of confidential and personal information that is collected and disseminated. Aptus understands that protection of all confidential information is essential. Aptus is committed to protect business and personal information of confidential nature obtained from clients, associates and employees. This information will solely be used to contact you about our services and products.";

const pages = {
  "our-story": {
    banner: { imageSrc: `${IMG}/about_banner-e1746943143932.jpg`, imageAlt: "our-story" },
    introRow: {
      title: "Our Pursuit",
      paragraphs: [STORY_INTRO],
      imageSrc: `${IMG}/award.jpg`,
      imageAlt: "Rajesh Malaviya",
      imagePosition: "left",
      headingAsH1: true,
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
          icon: "eye",
          variant: "green",
          description:
            'Our vision is to be recognized & respected in global IT market as a professional solution provider with constant innovation to make "IT" better for its clients by being their strategic business partner.',
        },
      ],
    },
    partnerships: partnerships(),
    contactCta: contactFormCta(),
  },

  "our-team": null, // hand-maintained in our-team.json

  "aptus-policy": {
    banner: { imageSrc: `${IMG}/sld.jpg`, imageAlt: "Aptus Policy" },
    intro: {
      id: "modus",
      visible: true,
      variant: "policy-panel",
      title: { accent: "Modus Operandi" },
      imageSrc: `${IMG}/Infographic_5_29_NEW_1-20200130123030-1024x455.jpg`,
      imageAlt: "Infographic",
      imagePosition: "below",
    },
    featureRows: [
      {
        heading: "Company",
        headingAccent: "Qualification",
        paragraphs: [
          "Aptus Infotech as a leading business organization in Oman, interacts and transacts with a variety of business organizations and governments in different jurisdictions. By maintaining the highest level of corporate integrity through open, honest and fair dealings, Aptus earns trust for its products and services from all stakeholders and every person with whom Aptus comes in contact.",
        ],
        imageSrc: `${IMG}/qualifi.jpg`,
        imageAlt: "Qualification",
        imagePosition: "right",
      },
      {
        paragraphs: [
          "Aptus obtains and conducts business legally and ethically. The quality of our products and the efficiency of our services at the most competitive prices are our greatest tools in marketing our business.",
        ],
        imageSrc: `${IMG}/quali2.jpg`,
        imageAlt: "Quality",
        imagePosition: "left",
      },
      {
        paragraphs: [
          "Aptus always adheres to high quality principle, focusing on constant quality management, and regular staff training, to improve our staff's management ability and skill levels.",
        ],
        imageSrc: `${IMG}/quali3.jpg`,
        imageAlt: "Quality Management",
        imagePosition: "right",
      },
    ],
    text: {
      id: "privacy",
      visible: true,
      presentation: { alignment: "center" },
      title: { before: "Policy on Privacy and", accent: "Confidentiality" },
      paragraphs: [PRIVACY],
    },
    partnerships: partnerships(),
    contactCta: contactFormCta(),
  },

  "why-aptus-infotech": {
    banner: { imageSrc: `${IMG}/mediaanner.jpg`, imageAlt: "Why Aptus Infotech" },
    hero: {
      id: "page-title",
      visible: true,
      variant: "why-panel",
      title: { accent: "Why Aptus Infotech" },
    },
    featureRows: [
      {
        variant: "panel",
        heading: "Our Values",
        bullets: [
          "Passionate about Clients success.",
          "Proactive and responsible.",
          "An uncompromising integrity in everything we do",
        ],
        imageSrc: `${IMG}/it-solutions-banner-768x300.jpg`,
        imageAlt: "Our Values",
        imagePosition: "right",
      },
      {
        variant: "panel",
        heading: "Our Experties",
        bullets: [
          "We have developed a diverse range of expertise to better serve our customers:",
          "We are proficient network designers,",
          "We have certified ELV implemtation team",
          "Providing complete solar solutions (Aptus Solar Tech)",
          "Experienced software sales and support team",
        ],
        imageSrc: `${IMG}/quali3.jpg`,
        imageAlt: "Our Expertise",
        imagePosition: "right",
      },
    ],
    text: {
      id: "privacy",
      visible: true,
      presentation: { alignment: "center" },
      title: { before: "Policy on Privacy and", accent: "Confidentiality" },
      paragraphs: [PRIVACY],
      imageSrc: `${IMG}/logo45.png`,
      imageAlt: "Privacy Policy",
      imagePosition: "below",
    },
    partnerships: partnerships(),
    contactCta: contactFormCta(),
  },

  "winning-together": {
    banner: { imageSrc: `${IMG}/Winning-together-e1746866590414.png`, imageAlt: "Winning Together" },
    hero: {
      id: "page-title",
      visible: true,
      title: { accent: "Winning Together" },
    },
    cards: {
      id: "pillars",
      visible: true,
      align: "center",
      variant: "pillars",
      items: [
        { title: "Joint Value", icon: "handshake" },
        { title: "Thought Leadership", icon: "users" },
        { title: "Executive Commitment", icon: "bullseye" },
      ],
    },
    featureRows: [
      {
        variant: "boxed",
        paragraphs: [
          "There are a lot of things that can go wrong with software. They range from inconveniences, slowdowns, and failures in the final solution that negatively affect the business in general to the implementation of an incomplete or entirely wrong solution that often means enormous amounts of wasted time and money. The potential problems can be related to planning, development or team organization. We can guide you in the complex software world. We aim to gain recognition and respect in global IT market as a professional solution provider and make IT better for its clients through constant innovation.",
          "Aptus's WINNING TOGETHER approach is all about driving joint Go to Market initiatives in partnership with Strategic Alliances and help customers Do Business Better.",
        ],
        imageSrc: `${IMG}/alliances-1024x576.jpg`,
        imageAlt: "Strategic Alliances",
        imagePosition: "right",
      },
    ],
    partnerships: partnerships(),
    contactCta: contactFormCta(),
  },

  "aptus-infotech-iso-certifications": {
    hero: {
      id: "hero",
      visible: true,
      variant: "iso-page",
      title: { accent: "Our Certifications" },
      subtitle:
        "ORIENTAL ORYX INTERNATIONAL L.L.C (APTUS INFOTECH) proudly adheres to the highest international standards. Our commitment to quality, environmental responsibility, and occupational health & safety is validated by these esteemed certifications.",
    },
    intro: {
      id: "intro",
      visible: true,
      title: { before: "Achieving Excellence Through", accent: "Recognized Standards" },
      paragraphs: [
        "At Aptus Infotech, we are committed to upholding the highest international standards in quality, environmental management, and occupational health & safety. Our accreditations demonstrate our dedication to excellence and our capability to provide reliable, globally recognized services.",
      ],
    },
    lists: [
      {
        id: "core-certs",
        visible: true,
        title: { accent: "Our Core Certifications" },
        items: [
          "ISO 9001:2015 – Quality Management System (QMS) Certification",
          "ISO 14001:2015 – Environmental Management System (EMS) Certification",
          "ISO 45001:2018 – Occupational Health & Safety (OH&S) Management System Certification",
        ],
      },
    ],
    featureRows: [
      {
        heading: "Quality Management System",
        headingAccent: "ISO 9001:2015",
        imageSrc: `${IMG07}/1-721x1024.png`,
        imageAlt: "ISO 9001:2015 Certificate",
        downloadHref: `${IMG07}/APTUS-CERT-9001-COPY-1.pdf`,
      },
      {
        heading: "Occupational Health & Safety Management System",
        headingAccent: "ISO 45001:2018",
        imageSrc: `${IMG07}/2-721x1024.png`,
        imageAlt: "ISO 45001:2018 Certificate",
        downloadHref: `${IMG07}/APTUS-CERT-45001-COPY.pdf`,
      },
      {
        heading: "Environmental Management System",
        headingAccent: "ISO 14001:2015",
        imageSrc: `${IMG07}/3-721x1024.png`,
        imageAlt: "ISO 14001:2015 Certificate",
        downloadHref: `${IMG07}/APTUS-CERT-14001-COPY.pdf`,
      },
    ],
    text: {
      id: "footer",
      visible: true,
      paragraphs: [
        "Aptus Infotech is dedicated to upholding top-tier international standards in quality (ISO 9001:2015), environmental management (ISO 14001:2015), and occupational health & safety (ISO 45001:2018), with processes rigorously certified and globally recognized. This ensures enhanced customer satisfaction, improved efficiency, reduced environmental impact, regulatory compliance, better workplace safety, and a stronger reputation for businesses partnering with us.",
      ],
    },
    contactCta: contactFormCta(),
  },

  career: {
    hero: {
      id: "hero",
      visible: true,
      variant: "career-page",
      title: { accent: "Join Our Team at Aptus Infotech" },
      subtitle: "Join Our Growing Team!",
    },
    intro: {
      id: "intro",
      visible: true,
      paragraphs: [
        "At Aptus Infotech, we believe that our employees are the foundation of our success. We are always on the lookout for passionate, innovative, and driven individuals to join our team. If you're looking to be part of a company that encourages creativity, collaboration, and continuous growth, then Aptus Infotech might be the place for you.",
      ],
    },
    contactCta: {
      heading: "Become a part of Aptus Infotech",
      showForm: true,
      formVariant: "career",
      submitLabel: "Submit Application",
      layout: "career",
    },
  },

  "contact-us": {
    hero: {
      id: "hero",
      visible: true,
      variant: "contact-page",
      title: { accent: "Contact Us" },
      subtitle: "REACH OUT FOR EXPERT GUIDANCE AND SUPPORT",
    },
    contactInfo: {
      id: "contact",
      visible: true,
      title: { before: "Company", accent: "Contact Information" },
      address:
        "1st Floor, Office No 11, Building: 19 Way No: 5205, Near AlNadha Tower, Opposite 77 Fresh Shopping Center, Ghala Muscat, Sultanate of Oman",
      email: "info@aptusinfotech.com",
      phone: "+968 9941 8481",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=H9P9%2BM6%20Muscat%2C%20Oman&t=m&z=12&output=embed&iwloc=near",
    },
    contactCta: {
      showForm: true,
      formVariant: "contact",
      submitLabel: "Submit Now",
      layout: "contact-page",
    },
  },
};

mkdirSync(OUT, { recursive: true });

for (const [slug, content] of Object.entries(pages)) {
  if (!content) continue;
  const path = `${OUT}/${slug}.json`;
  writeFileSync(path, JSON.stringify(content, null, 2), "utf8");
  console.log("Wrote", path);
}

console.log("Skipped our-team.json (hand-maintained)");
