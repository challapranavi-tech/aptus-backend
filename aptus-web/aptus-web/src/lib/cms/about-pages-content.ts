import type { MarketingPageContent } from "@/types/marketing-page";
import { SITE } from "@/lib/constants";

export type AboutPageKey =
  | "aboutUs"
  | "ourStory"
  | "ourTeam"
  | "aptusPolicy"
  | "whyAptus"
  | "winningTogether"
  | "isoCertifications"
  | "career"
  | "contactUs";

export type AboutPageConfig = {
  key: AboutPageKey;
  path: string;
  odooUrl: string;
  odooPageId: number;
  title: string;
  description: string;
};

export const ABOUT_PAGES: Record<AboutPageKey, AboutPageConfig> = {
  aboutUs: {
    key: "aboutUs",
    path: "/about-us",
    odooUrl: "/our-story",
    odooPageId: 249,
    title: "About Us | Aptus Infotech",
    description:
      "Learn about Aptus Infotech — 25 years of IT, ELV, and software expertise in Oman. Our mission, vision, and pursuit of client success.",
  },
  ourStory: {
    key: "ourStory",
    path: "/our-story",
    odooUrl: "/our-story",
    odooPageId: 249,
    title: "Our Story | The Journey of Aptus Infotech",
    description:
      "Discover the journey of Aptus Infotech — Oman’s premier system integrator and software consultant.",
  },
  ourTeam: {
    key: "ourTeam",
    path: "/our-team",
    odooUrl: "/our-team",
    odooPageId: 227,
    title: "Get to Know Our Team | Aptus Infotech",
    description: "Meet the leadership and team behind Aptus Infotech in Oman.",
  },
  aptusPolicy: {
    key: "aptusPolicy",
    path: "/aptus-policy",
    odooUrl: "/aptus-policy",
    odooPageId: 165,
    title: "Company Policies | Aptus Infotech",
    description: "Aptus Infotech policies on qualification, ethics, and confidentiality.",
  },
  whyAptus: {
    key: "whyAptus",
    path: "/why-aptus-infotech",
    odooUrl: "/why-aptus-infotech",
    odooPageId: 250,
    title: "Why Choose Aptus Infotech | Trusted IT Partner",
    description: "Why businesses in Oman choose Aptus Infotech.",
  },
  winningTogether: {
    key: "winningTogether",
    path: "/winning-together",
    odooUrl: "/winning-together",
    odooPageId: 251,
    title: "Winning Together | Aptus Infotech",
    description: "Joint go-to-market initiatives with strategic alliance partners.",
  },
  isoCertifications: {
    key: "isoCertifications",
    path: "/aptus-infotech-iso-certifications",
    odooUrl: "/aptus-infotech-iso-certifications",
    odooPageId: 253,
    title: "Aptus Infotech ISO Certifications",
    description: "ISO 9001, ISO 14001, and ISO 45001 certifications.",
  },
  career: {
    key: "career",
    path: "/career",
    odooUrl: "/career",
    odooPageId: 209,
    title: "Career | Aptus Infotech",
    description: "Join the Aptus Infotech team in Oman.",
  },
  contactUs: {
    key: "contactUs",
    path: "/contact-us",
    odooUrl: "/contact-us",
    odooPageId: 211,
    title: "Contact Us | Aptus Infotech",
    description: "Contact Aptus Infotech in Muscat, Oman.",
  },
};

const STORY_INTRO =
  "Aptus Infotech is the premier System Integrator & Software Consultant providing consulting services and training to large and medium businesses. Our experience of working with different domains has given us extensive industry insight and helped us in mastering our competencies. We do a comprehensive analysis of your industry — its size, tasks you want to carry out, your challenges — and subsequently map out a plan by recommending new elements to provide the right solutions that are cost effective and correspond to your business goals and IT strategy. We help streamline your business operations with wisely considered software solutions.";

function storyPageDefaults(config: AboutPageConfig): MarketingPageContent {
  return {
    metaTitle: config.title,
    metaDescription: config.description,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "Our", accent: "Pursuit" },
      subtitle:
        "Premier System Integrator & Software Consultant for large and medium businesses across Oman and the GCC.",
    },
    intro: { id: "intro", visible: true, paragraphs: [STORY_INTRO] },
    cards: {
      id: "cards",
      visible: true,
      eyebrow: "Performance",
      title: { before: "We are powered by", accent: "performance" },
      align: "center",
      items: [
        {
          title: "Mission",
          body: "To provide expert services at fair prices, help you overcome your problems and eliminate the risks involved by providing effective measures and turn your project into success.",
        },
        {
          title: "Vision",
          body: 'Our vision is to be recognized & respected in the global IT market as a professional solution provider with constant innovation to make "IT" better for its clients by being their strategic business partner.',
        },
      ],
    },
    showKeyEnablers: true,
    showPartnerships: true,
    showContactCta: true,
  };
}

export const DEFAULT_ABOUT_PAGE_CONTENT: Record<AboutPageKey, MarketingPageContent> = {
  aboutUs: storyPageDefaults(ABOUT_PAGES.aboutUs),
  ourStory: storyPageDefaults(ABOUT_PAGES.ourStory),
  ourTeam: {
    metaTitle: ABOUT_PAGES.ourTeam.title,
    metaDescription: ABOUT_PAGES.ourTeam.description,
    source: "static",
    hero: { id: "hero", visible: true, title: { before: "Management", accent: "Profile" } },
    team: {
      id: "team",
      visible: true,
      eyebrow: "Our Team",
      title: { before: "Our core strength is our", accent: "team" },
      members: [
        {
          name: "Rajesh Malaviya",
          role: "CEO & Co-Founder",
          bio: "Rajesh Malaviya guided Oriental Oryx (Aptus Infotech) through two decades of growth to emerge as a leader in the IT and software industry in Oman.",
        },
        {
          name: "Mubin Mir",
          role: "Director Sales",
          bio: "A commerce graduate and team player with expertise in business development and long-term value creation from customers, markets, and relationships.",
        },
      ],
      closingParagraphs: [
        "We recognize our primary asset is people. Mutual respect provides the foundation for our success.",
        "Aptus Infotech team is diverse, with employees from over 5–7 countries and a cadre of talented Omanis growing professionally in the IT industry.",
      ],
    },
    showContactCta: true,
  },
  aptusPolicy: {
    metaTitle: ABOUT_PAGES.aptusPolicy.title,
    metaDescription: ABOUT_PAGES.aptusPolicy.description,
    source: "static",
    hero: { id: "hero", visible: true, title: { before: "Modus", accent: "Operandi" } },
    cards: {
      id: "cards",
      visible: true,
      title: { before: "Company", accent: "Qualification" },
      items: [
        {
          title: "Company Qualification",
          body: "Aptus Infotech maintains the highest level of corporate integrity through open, honest and fair dealings, earning trust from all stakeholders.",
        },
        {
          title: "Quality & Ethics",
          body: "Aptus conducts business legally and ethically, adhering to high quality principles with constant quality management and staff training.",
        },
      ],
    },
    text: {
      id: "privacy",
      visible: true,
      title: { before: "Policy on Privacy and", accent: "Confidentiality" },
      paragraphs: [
        "Aptus is committed to protect business and personal information obtained from clients, associates and employees. This information will solely be used to contact you about our services and products.",
      ],
      background: "muted",
    },
    showPartnerships: true,
    showContactCta: true,
  },
  whyAptus: {
    metaTitle: ABOUT_PAGES.whyAptus.title,
    metaDescription: ABOUT_PAGES.whyAptus.description,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "Why", accent: "Aptus Infotech" },
      subtitle: "Our values and expertise that set us apart as your trusted IT partner.",
    },
    lists: [
      {
        id: "values",
        visible: true,
        eyebrow: "Our Values",
        items: [
          "Passionate about client success.",
          "Proactive and responsible.",
          "An uncompromising integrity in everything we do.",
        ],
      },
      {
        id: "expertise",
        visible: true,
        eyebrow: "Our Expertise",
        items: [
          "Proficient network designers and certified ELV implementation team.",
          "Complete solar solutions (Aptus Solar Tech).",
          "Experienced software sales and support team.",
        ],
      },
    ],
    showPartnerships: true,
    showContactCta: true,
  },
  winningTogether: {
    metaTitle: ABOUT_PAGES.winningTogether.title,
    metaDescription: ABOUT_PAGES.winningTogether.description,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "", accent: "Winning Together" },
      subtitle: "Joint go-to-market initiatives with strategic alliance partners.",
    },
    text: {
      id: "intro",
      visible: true,
      paragraphs: [
        "We guide you in the complex software world and aim to make IT better for our clients through constant innovation.",
        "Aptus’s Winning Together approach drives joint initiatives with strategic alliances to help customers do business better.",
      ],
    },
    cards: {
      id: "pillars",
      visible: true,
      align: "center",
      items: [
        { title: "Joint Value", body: "Collaborative offerings with leading vendor technology." },
        { title: "Thought Leadership", body: "Industry insight shared with clients and partners." },
        { title: "Executive Commitment", body: "Senior leadership aligned on long-term partnership success." },
      ],
    },
    showPartnerships: true,
    showContactCta: true,
  },
  isoCertifications: {
    metaTitle: ABOUT_PAGES.isoCertifications.title,
    metaDescription: ABOUT_PAGES.isoCertifications.description,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "Our", accent: "Certifications" },
      subtitle: "ORIENTAL ORYX INTERNATIONAL L.L.C (APTUS INFOTECH) adheres to the highest international standards.",
    },
    certifications: {
      id: "certifications",
      visible: true,
      eyebrow: "Standards",
      title: { before: "Achieving excellence through", accent: "recognized standards" },
      intro: "Our commitment to quality, environmental responsibility, and occupational health & safety is validated by these certifications.",
      items: [
        { title: "ISO 9001:2015", description: "Quality Management System (QMS) Certification" },
        { title: "ISO 14001:2015", description: "Environmental Management System (EMS) Certification" },
        { title: "ISO 45001:2018", description: "Occupational Health & Safety Management System Certification" },
      ],
      footerParagraph: "These certifications demonstrate our dedication to excellence and continuous improvement.",
    },
    showContactCta: true,
  },
  career: {
    metaTitle: ABOUT_PAGES.career.title,
    metaDescription: ABOUT_PAGES.career.description,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "Join Our Team at", accent: "Aptus Infotech" },
      subtitle: "Join our growing team!",
    },
    intro: {
      id: "intro",
      visible: true,
      paragraphs: [
        "At Aptus Infotech, we believe employees are the foundation of our success. We look for passionate, innovative individuals.",
        "If you want creativity, collaboration, and continuous growth, Aptus Infotech might be the place for you.",
      ],
    },
    text: {
      id: "apply",
      visible: true,
      title: { before: "Become a part of", accent: "Aptus Infotech" },
      paragraphs: [
        `Send your CV to ${SITE.email} with the job title in the subject line.`,
      ],
      background: "muted",
      align: "center",
    },
    showContactCta: true,
  },
  contactUs: {
    metaTitle: ABOUT_PAGES.contactUs.title,
    metaDescription: ABOUT_PAGES.contactUs.description,
    source: "static",
    contactInfo: {
      id: "contact",
      visible: true,
      title: { before: "Company", accent: "Contact Information" },
      subtitle: "Reach out for expert guidance and support",
      address: SITE.address,
      email: SITE.email,
      phone: SITE.phoneAlt,
    },
    showContactCta: false,
  },
};

export function getAboutPagePaths(): string[] {
  return Object.values(ABOUT_PAGES).map((page) => page.path.replace(/^\//, ""));
}
