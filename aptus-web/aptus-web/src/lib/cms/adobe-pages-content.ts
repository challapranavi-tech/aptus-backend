import { SITE } from "@/lib/constants";
import type { SoftwareInnerPageKey } from "@/lib/cms/software-inner-pages-content";
import type { MarketingPageContent, MarketingPageSections } from "@/types/marketing-page";

const MAILTO = `mailto:${SITE.email}`;

const APTUS_WHY_CHOOSE = {
  id: "why-aptus",
  visible: true,
  eyebrow: "Why Aptus",
  title: { before: "Why Choose", accent: "Aptus Infotech" },
  align: "center" as const,
  items: [
    {
      title: "Official Partner",
      body: "As an authorized Adobe partner, we provide access to genuine Adobe products.",
    },
    {
      title: "Technical Support",
      body: "Our support team assists with installation, troubleshooting, and usage questions.",
    },
    {
      title: "Local Presence",
      body: "With offices in Oman, we provide personalized service and quick response times.",
    },
    {
      title: "Expert Training",
      body: "Certified trainers deliver comprehensive training programs tailored to your industry needs.",
    },
  ],
};

/** Hub page — mirrors https://aptusinfotech.com/adobe/ */
export const DEFAULT_ADOBE_HUB_CONTENT: MarketingPageContent = {
  metaTitle: "Adobe Official Distributor Oman | Aptus Infotech",
  metaDescription:
    "Aptus Infotech — your trusted provider of genuine Adobe software with premium support and training in Oman.",
  source: "static",
  hero: {
    id: "hero",
    visible: true,
    title: { before: "Adobe Solutions Partner in", accent: "Oman" },
    subtitle:
      "Aptus Infotech — your trusted provider of genuine Adobe software with premium support and training. Offers best rates in the market.",
    ctaLabel: "Request a Quote",
    ctaHref: MAILTO,
  },
  intro: {
    id: "intro",
    visible: true,
    title: { before: "Popular", accent: "Adobe Products" },
    paragraphs: [
      "As an Adobe Partner, we offer the complete range of Adobe software solutions for all industries.",
    ],
  },
  cards: {
    id: "popular-products",
    visible: true,
    align: "center",
    items: [
      {
        title: "Adobe Photoshop",
        body: "The industry-standard photo editing and graphic design software for professionals.",
      },
      {
        title: "Adobe Illustrator",
        body: "Professional vector graphics software for logos, icons, drawings, and illustrations.",
      },
      {
        title: "Adobe InDesign",
        body: "Professional page layout and design software for print and digital publishing.",
      },
      {
        title: "Adobe After Effects",
        body: "Create cinematic movie titles, intros, and transitions with professional video editing software.",
      },
      {
        title: "Adobe Premiere Pro",
        body: "Professional video editing software for film, TV, and the web with intuitive workflows.",
      },
      {
        title: "Adobe Acrobat Pro",
        body: "Create, edit, sign, and track PDFs with the complete PDF solution.",
      },
      {
        title: "Adobe Audition",
        body: "Professional audio workstation for mixing, finishing, and precision editing.",
      },
      {
        title: "Adobe XD",
        body: "Vector design tool for web and mobile apps, from wireframe to prototype.",
      },
    ],
  },
  cardSections: [
    {
      id: "why-partner",
      visible: true,
      eyebrow: "Why Aptus",
      title: { before: "Why Choose", accent: "Aptus Infotech" },
      align: "center",
      items: [
        {
          title: "Adobe Partner",
          body: "Our partner status represents expertise and commitment to Adobe solutions in Oman.",
        },
        {
          title: "Genuine Products",
          body: "All Adobe products are 100% genuine with full manufacturer support and updates.",
        },
        {
          title: "Competitive Pricing",
          body: "We offer competitive prices for Adobe software in the Omani market.",
        },
        {
          title: "Expert Team",
          body: "Our certified professionals provide expert advice and support for all Adobe products.",
        },
      ],
    },
  ],
  showPartnerships: true,
  showContactCta: true,
};

const ADOBE_INNER_CONTENT: Partial<Record<SoftwareInnerPageKey, MarketingPageContent>> = {
  etap: undefined,
  adobeBusinessCreative: {
    metaTitle: "Adobe Business Creative Solution | Aptus Infotech",
    metaDescription:
      "Adobe Business & Creative Solutions — empowering creativity and digital transformation in Oman.",
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { accent: "Adobe Business & Creative Solutions" },
      subtitle: "Empowering Creativity and Digital Transformation",
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      paragraphs: [
        "Adobe offers an unparalleled suite of software and services that are the industry standard for creative professionals and a powerful asset for businesses seeking to enhance their digital presence and productivity.",
        "From visual content creation and digital document management to sophisticated marketing tools, Adobe's solutions empower organizations to innovate, collaborate, and effectively engage with their audiences.",
      ],
    },
    lists: [
      {
        id: "capabilities",
        visible: true,
        title: { before: "Adobe Business & Creative Solutions", accent: "empower you to" },
        items: [
          "Create world-class digital content with Creative Cloud applications including Photoshop, Illustrator, InDesign, Premiere Pro, and After Effects.",
          "Streamline document workflows with Adobe Acrobat — e-signatures, review, forms, and secure PDF management.",
          "Foster seamless collaboration with cloud-based features for real-time teamwork.",
          "Drive digital experiences with Adobe XD, web development, and digital publishing tools.",
          "Enhance brand consistency and marketing impact across all creative assets.",
          "Stay ahead with continuous updates and integration with emerging technologies including AI.",
        ],
      },
    ],
    cards: {
      id: "offerings",
      visible: true,
      title: { before: "Key", accent: "Offerings" },
      align: "center",
      items: [
        { title: "Creative Cloud for Teams", body: "Team licensing with admin console and shared assets." },
        { title: "Adobe Express", body: "Quick creative content for marketing and social teams." },
        { title: "Adobe Acrobat Pro", body: "Enterprise PDF and e-signature workflows." },
        { title: "Adobe Stock", body: "Licensed stock assets integrated with Creative Cloud." },
        { title: "Enterprise Solutions", body: "Volume licensing and deployment for larger organizations." },
      ],
    },
    cardSections: [APTUS_WHY_CHOOSE],
    showPartnerships: true,
    showContactCta: true,
  },
  adobeAcrobatPro: {
    metaTitle: "Buy Adobe Acrobat Pro for Teams in Oman | Aptus Infotech",
    metaDescription:
      "Adobe Acrobat Pro DC — the world's leading PDF solution for professionals in Oman.",
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { accent: "Adobe Acrobat Pro DC" },
      subtitle: "The World's Leading PDF Solution for Professionals",
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      title: { before: "Create, Edit &", accent: "Secure PDF Documents" },
      paragraphs: [
        "Adobe Acrobat Pro DC empowers you to professionally edit text and images, convert files to and from PDF, combine documents, and implement robust security features like password protection and redaction.",
        "As the trusted provider of software solutions in Oman, Aptus Infotech brings genuine Acrobat Pro licensing and expert support to your business.",
      ],
    },
    cardSections: [
      {
        id: "tools",
        visible: true,
        eyebrow: "Features",
        title: { before: "Powerful PDF", accent: "Management Tools" },
        align: "center",
        items: [
          { title: "Create & Edit PDFs", body: "Convert any file to PDF or create new documents. Edit text, images, and formatting directly." },
          { title: "Digital Signatures", body: "Add legally binding signatures and track document status in real time." },
          { title: "Advanced Security", body: "Password protection, permission controls, and redaction for sensitive information." },
          { title: "Annotation & Markup", body: "Sticky notes, highlights, stamps, and drawing markup for collaboration." },
          { title: "Cross-Platform Access", body: "Work across desktop, web, and mobile with Adobe Document Cloud sync." },
          { title: "Form Creation", body: "Create interactive forms with dropdowns, checkboxes, and automatic data collection." },
        ],
      },
      {
        id: "benefits",
        visible: true,
        eyebrow: "Benefits",
        title: { before: "Why Choose", accent: "Adobe Acrobat Pro?" },
        align: "center",
        items: [
          { title: "Industry Standard", body: "Used by millions across legal, business, education, and government sectors." },
          { title: "Seamless Integration", body: "Works with Microsoft Office, Outlook, SharePoint, and Creative Cloud apps." },
          { title: "Enhanced Security", body: "Encryption, certificate-based signatures, and audit trails for compliance." },
          { title: "Collaboration Power", body: "Share documents securely and gather feedback from multiple reviewers." },
        ],
      },
      APTUS_WHY_CHOOSE,
    ],
    showPartnerships: true,
    showContactCta: true,
  },
  adobeIllustrator: {
    metaTitle: "Adobe Illustrator Licenses in Oman | Buy Creative Cloud",
    metaDescription:
      "Adobe Illustrator — industry-standard vector graphics software in Oman from Aptus Infotech.",
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { accent: "Adobe Illustrator" },
      subtitle:
        "The industry-standard vector graphics software for creating stunning illustrations and designs",
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      title: { before: "Create Stunning", accent: "Vector Art" },
      paragraphs: [
        "For decades, artists and designers have depended on Adobe Illustrator to transform ideas into striking artwork. Illustrator provides an intuitive platform for drawing, sketching, and manipulating paths with robust typography and generative AI features.",
        "From logos and packaging to illustrations and web assets, Illustrator delivers infinitely scalable, high-quality design output.",
      ],
    },
    cardSections: [
      {
        id: "features",
        visible: true,
        eyebrow: "Features",
        title: { before: "Powerful", accent: "Features" },
        align: "center",
        items: [
          { title: "Precision Drawing Tools", body: "Advanced pen tool, shapes, and path editing for clean vector art." },
          { title: "Layer Management", body: "Organize complex artwork with layers, groups, and masks." },
          { title: "Color & Gradient Control", body: "Palettes, gradient mesh, and pattern creation capabilities." },
          { title: "Type Engine", body: "Professional typography with advanced character and paragraph controls." },
          { title: "Scalability", body: "Scale artwork infinitely without loss of quality." },
          { title: "Cloud Integration", body: "Creative Cloud libraries, fonts, and collaboration tools." },
        ],
      },
      {
        id: "benefits",
        visible: true,
        eyebrow: "Benefits",
        title: { before: "Benefits for", accent: "Every User" },
        align: "center",
        items: [
          { title: "Graphic Designers", body: "Logos, branding, and marketing assets with precision." },
          { title: "Digital Illustrators", body: "Natural brush strokes and detailed vector control." },
          { title: "Data Visualization", body: "Clear infographics and visual reports." },
          { title: "UI/UX Designers", body: "Wireframes, icons, and interface elements for web and mobile." },
        ],
      },
      APTUS_WHY_CHOOSE,
    ],
    showPartnerships: true,
    showContactCta: true,
  },
  adobePhotoshop: {
    metaTitle: "Buy Adobe Photoshop in Oman: Genuine Licenses & Support",
    metaDescription:
      "Adobe Photoshop — professional image editing and graphic design from Aptus Infotech Oman.",
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { accent: "Adobe Photoshop" },
      subtitle:
        "The world's best imaging and graphic design software is at the core of just about every creative project",
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      title: { before: "Professional", accent: "Image Editing" },
      paragraphs: [
        "Adobe Photoshop is the definitive industry-standard software for digital image editing and graphic design. Photoshop empowers you to transform photos, craft sophisticated artwork, and bring visual concepts to life with precision.",
        "Layers, masks, and adjustment layers enable non-destructive editing — experiment and refine without permanently altering original pixels.",
      ],
    },
    cardSections: [
      {
        id: "features",
        visible: true,
        eyebrow: "Features",
        title: { before: "Powerful", accent: "Features" },
        align: "center",
        items: [
          { title: "Advanced Layers", body: "Non-destructive editing with layers, masks, and adjustment layers." },
          { title: "AI-Powered Tools", body: "Select Subject, Content-Aware Fill, and Neural Filters with Adobe Sensei." },
          { title: "Digital Painting", body: "Customizable brushes and realistic painting tools." },
          { title: "Content-Aware Tools", body: "Remove elements and fill gaps intelligently." },
          { title: "Advanced Adjustments", body: "Curves, levels, color balance, and professional color grading." },
          { title: "Creative Cloud Integration", body: "Work across Adobe apps and access assets anywhere." },
        ],
      },
      {
        id: "benefits",
        visible: true,
        eyebrow: "Benefits",
        title: { before: "Benefits for", accent: "Every Creator" },
        align: "center",
        items: [
          { title: "For Photographers", body: "Retouching, color correction, and compositing." },
          { title: "For Designers", body: "Graphics, layouts, and visual elements with creative control." },
          { title: "For Artists", body: "Digital painting simulating traditional media." },
          { title: "For Content Creators", body: "Eye-catching visuals for social, web, and video." },
        ],
      },
      APTUS_WHY_CHOOSE,
    ],
    showPartnerships: true,
    showContactCta: true,
  },
  adobePremierePro: {
    metaTitle: "Adobe Premiere Pro Subscription in Oman - Aptus Infotech",
    metaDescription:
      "Adobe Premiere Pro — industry-standard professional video editing software in Oman.",
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { accent: "Adobe Premiere Pro" },
      subtitle: "The Industry Standard for Professional Video Editing",
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      paragraphs: [
        "Adobe Premiere Pro is the leading professional video editing software used by filmmakers, broadcasters, YouTubers, and content creators worldwide. It provides a comprehensive timeline-based editing environment for stories from social clips to feature films.",
      ],
    },
    lists: [
      {
        id: "capabilities",
        visible: true,
        title: { before: "Adobe Premiere Pro", accent: "empowers you to" },
        items: [
          "Perform non-linear video editing with precision across multiple tracks.",
          "Support diverse formats from SD to 4K, 8K, and VR natively.",
          "Master color correction and grading with Lumetri Color tools.",
          "Refine audio with effects, noise reduction, and Audition integration.",
          "Create dynamic graphics and titles with the Essential Graphics panel.",
          "Streamline multi-camera editing for events and interviews.",
          "Collaborate with Team Projects across locations.",
          "Integrate seamlessly with After Effects, Photoshop, and Audition.",
        ],
      },
    ],
    cardSections: [APTUS_WHY_CHOOSE],
    showPartnerships: true,
    showContactCta: true,
  },
};

export function getAdobeHubContent(): MarketingPageContent {
  return DEFAULT_ADOBE_HUB_CONTENT;
}

export function getAdobeInnerContent(key: SoftwareInnerPageKey): MarketingPageContent | null {
  return ADOBE_INNER_CONTENT[key] ?? null;
}

export function toOdooSections(content: MarketingPageContent): MarketingPageSections {
  const { metaTitle: _t, metaDescription: _d, source: _s, ...sections } = content;
  void _t;
  void _d;
  void _s;
  return sections;
}
