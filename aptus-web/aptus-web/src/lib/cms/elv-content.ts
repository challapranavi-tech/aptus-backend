import { MAIN_PAGES } from "@/lib/cms/main-pages";
import { SITE } from "@/lib/constants";
import type { ElvPageContent } from "@/types/elv-page";

/** Default ELV page content — mirrors aptusinfotech.com /elv-solutions fallback. */
export const DEFAULT_ELV_PAGE_CONTENT: ElvPageContent = {
  metaTitle: MAIN_PAGES.elvSolutions.title,
  metaDescription: MAIN_PAGES.elvSolutions.description,
  source: "static",
  hero: {
    id: "hero",
    visible: true,
    title: {
      before: "Comprehensive",
      accent: "ELV Solutions",
      after: "in Oman",
    },
    subtitle:
      "Extra Low Voltage systems for modern buildings — CCTV, access control, structured cabling, and smart building integration.",
    ctaLabel: "Request a Quote",
    ctaHref: `mailto:${SITE.email}`,
  },
  intro: {
    id: "intro",
    visible: true,
    eyebrow: "ELV & Security",
    title: {
      before: "Your trusted",
      accent: "ELV systems integrator",
    },
    paragraphs: [
      "Aptus Infotech has a proficient team in supplying, installing, and commissioning a range of ELV and security systems. These systems are designed to meet present customer needs and scale for future demands while keeping pace with evolving technology.",
      "From design and procurement through installation, testing, and commissioning, we deliver end-to-end ELV solutions for commercial, industrial, healthcare, education, and government projects across Oman and the GCC.",
    ],
  },
  solutions: {
    id: "solutions",
    visible: true,
    eyebrow: "Portfolio",
    title: {
      before: "Our",
      accent: "ELV Solutions",
    },
    subtitle: "Integrated extra-low-voltage systems for safe, smart, and connected buildings",
    items: [
      {
        title: "CCTV Surveillance",
        description:
          "IP and analog camera systems with recording, monitoring, and remote access for comprehensive site security.",
      },
      {
        title: "Access Control",
        description:
          "Card, biometric, and mobile access systems to manage entry points and protect people and assets.",
      },
      {
        title: "Structured Cabling",
        description:
          "Copper and fiber infrastructure for reliable data, voice, and network connectivity across your facility.",
      },
      {
        title: "Public Address & AV",
        description:
          "Paging, background music, and audio-visual systems for announcements, events, and collaboration spaces.",
      },
      {
        title: "Fire Alarm Systems",
        description:
          "Detection, notification, and integration with building safety systems to meet regulatory requirements.",
      },
      {
        title: "Building Management",
        description:
          "BMS and home automation for HVAC, lighting, and energy monitoring with centralized control.",
      },
    ],
  },
  process: {
    id: "process",
    visible: true,
    eyebrow: "Process",
    title: {
      before: "How we deliver",
      accent: "ELV projects",
    },
    items: [
      {
        step: "1",
        title: "Site Survey",
        description:
          "We assess your facility, requirements, and compliance needs to design the right ELV scope.",
      },
      {
        step: "2",
        title: "Design & BOQ",
        description:
          "Detailed system design, bill of quantities, and vendor selection aligned to your budget and timeline.",
      },
      {
        step: "3",
        title: "Installation",
        description:
          "Certified technicians install cabling, devices, and control systems with minimal disruption.",
      },
      {
        step: "4",
        title: "Testing",
        description:
          "End-to-end testing, integration checks, and handover documentation before go-live.",
      },
      {
        step: "5",
        title: "Support",
        description:
          "Ongoing maintenance, upgrades, and responsive support from our Muscat-based team.",
      },
    ],
  },
  whyChoose: {
    id: "whyChoose",
    visible: true,
    eyebrow: "Why Aptus",
    title: {
      before: "Why choose",
      accent: "Aptus Infotech",
    },
    items: [
      {
        title: "Experienced Integrators",
        description:
          "25+ years delivering IT and ELV projects for healthcare, energy, education, and public sector clients.",
      },
      {
        title: "End-to-End Delivery",
        description:
          "Single partner from survey and design through installation, commissioning, and after-sales support.",
      },
      {
        title: "Quality Products",
        description:
          "We work with leading global brands to ensure reliable, standards-compliant ELV systems.",
      },
      {
        title: "Local Presence",
        description:
          "Muscat-based team providing fast response, on-site support, and long-term partnership in Oman.",
      },
    ],
  },
  showContactCta: true,
};
