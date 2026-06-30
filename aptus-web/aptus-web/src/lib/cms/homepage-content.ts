import { KEY_ENABLERS, SERVICES, SITE } from "@/lib/constants";
import type {
  HomePageContent,
  KeyEnablersSectionContent,
  ServicesSectionContent,
} from "@/types/sections";

const WP = "https://aptusinfotech.com/wp-content/uploads/2025/05";

/** Default homepage section content — mirrors aptusinfotech.com static fallback. */
export const DEFAULT_HOMEPAGE_CONTENT: HomePageContent = {
  metaTitle: SITE.title,
  metaDescription: SITE.description,
  source: "static",
  hero: {
    id: "hero",
    visible: true,
    imageSrc: `${WP}/25-years-1024x256.png`,
    imageAlt: "Aptus Infotech 25 Years",
    imageWidth: 1024,
    imageHeight: 256,
  },
  features: [
    {
      id: "elv",
      visible: true,
      eyebrow: "ELV & Security",
      title: {
        before: "Aptus Infotech's comprehensive",
        accent: "ELV & Security",
      },
      description:
        "These systems are designed to meet the present needs of the customers as well as scalable for future demands and to keep at par with the evolving technology.",
      imageSrc: `${WP}/Aptusinfo.jpg`,
      imageAlt: "Aptus Infotech ELV and Security",
      href: "/elv-solutions",
      imagePosition: "left",
      background: "white",
    },
    {
      id: "software",
      visible: true,
      eyebrow: "Software",
      title: {
        before: "Aptus Infotech's Value Added",
        accent: "Software Services",
      },
      description:
        "Witness the most professional ICT and Engineering Services for clients across all sectors. We also help clients to make the move from CAD to BIM.",
      imageSrc: `${WP}/fdsg-1.jpg`,
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
    title: {
      before: "We Provide Industry Demand",
      accent: "Services",
    },
    items: SERVICES.map((service) => ({
      title: service.title,
      description: service.description,
      icon: service.icon,
      hoverImageSrc:
        "https://aptusinfotech.com/wp-content/uploads/2025/05/Home-Automation.webp",
    })),
  },
  keyEnablers: buildKeyEnablersSectionContent(),
  testimonial: {
    id: "testimonial",
    visible: true,
    quote:
      "We would like to acknowledge and extend my heartfelt gratitude to Aptus Infotech for done an IT project in our Indian School Wadi Kabir international. We appreciate the commitment & dedication shown by Aptus Infotech for their implementation and services. We also admire about their aspiration for their prompt and flawless support from project team. We look forward for continual long-term association with Aptus Infotech",
    authorName: "Nambi Rajesh",
    authorTitle: "IT Manager, Indian School Wadi Kabir International",
    authorImageSrc: `${WP}/logotest.png`,
    backgroundImageSrc:
      "https://aptusinfotech.com/wp-content/uploads/2025/05/Screenshot-2021-03-10-112925-e1621242309273-1.png",
  },
};

export function buildKeyEnablersSectionContent(): KeyEnablersSectionContent {
  return {
    id: "key-enablers",
    visible: true,
    eyebrow: "Key Enablers",
    title: {
      before: "We Provide Industry Demand",
      accent: "Services",
    },
    subtitle: "To Do Business In A Better Way And Provide Quintessential Services",
    items: KEY_ENABLERS.map((item) => ({
      number: item.number,
      title: item.title,
      description: item.description,
    })),
  };
}

export function buildServicesSectionContent(): ServicesSectionContent {
  return DEFAULT_HOMEPAGE_CONTENT.services;
}
