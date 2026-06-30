/** Top-level marketing pages — Odoo url should match website.page url on staging. */
export const MAIN_PAGES = {
  aboutUs: {
    path: "/about-us",
    odooUrl: "/about-us",
    title: "About Us | Aptus Infotech",
    description:
      "Learn about Aptus Infotech — 25 years of IT, ELV, and software expertise in Oman. Our mission, vision, and pursuit of client success.",
  },
  software: {
    path: "/software",
    odooUrl: "/software-solutions",
    title: "Software Solutions | Aptus Infotech",
    description:
      "Premium software solutions from Autodesk, Adobe, Microsoft, Oracle, and more. Licensing, implementation, training, and support in Oman.",
  },
  elvSolutions: {
    path: "/elv-solutions",
    odooUrl: "/elv-solutions",
    title: "ELV Solutions in Oman | Aptus Infotech",
    description:
      "Comprehensive Extra Low Voltage systems — CCTV, access control, structured cabling, and smart building solutions in Oman.",
  },
  caseStudies: {
    path: "/aptus-case-studies",
    odooUrl: "/aptus-case-studies",
    title: "Aptus Case Studies | Aptus Infotech",
    description:
      "Customer success stories and project case studies from Aptus Infotech across healthcare, energy, and public sector.",
  },
} as const;

export type MainPageKey = keyof typeof MAIN_PAGES;
