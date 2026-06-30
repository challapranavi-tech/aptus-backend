import { MAIN_PAGES } from "@/lib/cms/main-pages";
import { SITE } from "@/lib/constants";
import type { SoftwarePageContent } from "@/types/software-page";

/** Default Software page content — mirrors aptusinfotech.com /software fallback. */
export const DEFAULT_SOFTWARE_PAGE_CONTENT: SoftwarePageContent = {
  metaTitle: MAIN_PAGES.software.title,
  metaDescription: MAIN_PAGES.software.description,
  source: "static",
  hero: {
    id: "hero",
    visible: true,
    title: {
      before: "Premium Software Solutions for",
      accent: "Modern Businesses",
    },
    subtitle:
      "Empowering businesses with cutting-edge software solutions from industry-leading brands.",
    ctaLabel: "Request a Quote",
    ctaHref: `mailto:${SITE.email}`,
  },
  intro: {
    id: "intro",
    visible: true,
    eyebrow: "Software",
    title: {
      before: "Your Premier",
      accent: "Software Solutions",
      after: "Provider",
    },
    paragraphs: [
      "Aptus Infotech is a leading provider of premium software solutions designed to help businesses streamline operations, enhance productivity, and drive growth. With over 25 years of experience in the IT industry, we have successfully delivered cutting-edge software solutions to clients across various sectors.",
      "As an authorized partner of industry-leading software brands, we offer genuine licenses, expert implementation, and comprehensive support for all our software solutions.",
    ],
  },
  categories: {
    id: "categories",
    visible: true,
    eyebrow: "Portfolio",
    title: {
      before: "Our",
      accent: "Software Solutions",
    },
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
    title: {
      before: "How we deliver",
      accent: "exceptional solutions",
    },
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
    title: {
      before: "Why Choose",
      accent: "Aptus Infotech",
    },
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
