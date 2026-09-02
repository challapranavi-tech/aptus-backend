import type { Features, LogoGrid, Testimonials } from "@/types";

/** Marketing sections for /software-solutions. */

export const SOFTWARE_PARTNERSHIPS: LogoGrid = {
  type: "logo-grid",
  heading: "Winning together with",
  headingAccent: "Strategic Alliances",
  variant: "alliances",
  items: [
    { id: "planswift", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/planswift.png", alt: "PlanSwift" },
    { id: "prokon", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/Prokon.png", alt: "Prokon" },
    { id: "sketchup", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/Sketchup.png", alt: "SketchUp" },
    { id: "sophos", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/sophos.png", alt: "Sophos" },
    { id: "spectronova", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/spectronova.png", alt: "Spectronova" },
    { id: "aconex", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/aconex.png", alt: "Aconex" },
    { id: "autodesk", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/Autodesk.png", alt: "Autodesk" },
    { id: "etap", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/etap.png", alt: "ETAP" },
    { id: "fortinet", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/fortinet.png", alt: "Fortinet" },
    { id: "kaspersky", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/kaspersky.png", alt: "Kaspersky" },
    { id: "microsoft", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/Microsoft.png", alt: "Microsoft" },
    { id: "lumion", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/lumion.png", alt: "Lumion" },
    { id: "paloalto", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/paloalto.png", alt: "Palo Alto" },
    { id: "vray", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/v.ray_.png", alt: "V-Ray" },
    { id: "twinmotion", src: "https://aptusinfotech.com/wp-content/uploads/2025/08/twinmotion.png", alt: "Twinmotion" },
  ],
};

export interface SoftwareLandingCard {
  id: string;
  title: string;
  description?: string;
  icon: "search" | "license" | "cost" | "deploy" | "guidance" | "manage" | "optimize" | "implement";
  imageSrc: string;
  imageAlt: string;
}

export const SOFTWARE_CHALLENGES = {
  heading: "Software Challenges Shouldn’t Slow Your Business Down",
  subheading: "Common friction points we help teams remove every day",
  items: [
    {
      id: "finding",
      title: "Finding the right software for your business needs",
      icon: "search",
      imageSrc:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Team collaborating around laptops to choose the right software",
    },
    {
      id: "licenses",
      title: "Managing licenses, subscriptions, and renewals efficiently",
      icon: "license",
      imageSrc:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Professional reviewing software licenses and subscription documents",
    },
    {
      id: "costs",
      title: "Controlling software costs and avoiding unnecessary expenses",
      icon: "cost",
      imageSrc:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Business team reviewing software costs and budget planning",
    },
    {
      id: "implementation",
      title: "Simplifying implementation, integration, and deployment",
      icon: "deploy",
      imageSrc:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Engineers working together on software implementation",
    },
  ] satisfies SoftwareLandingCard[],
};

export const SOFTWARE_OUR_SOLUTIONS = {
  heading: "Our Solutions",
  subheading: "One platform to simplify your entire software journey",
  items: [
    {
      id: "right-software",
      title: "The Right Software",
      description:
        "Get expert guidance to choose the software and licensing option that best fits your business needs.",
      icon: "guidance",
      imageSrc:
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Consultant advising a client on the right software choice",
    },
    {
      id: "license-management",
      title: "Simplified License Management",
      description:
        "Manage licenses, subscriptions, renewals, and upgrades with greater ease and visibility.",
      icon: "manage",
      imageSrc:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Professional managing software licenses on a laptop",
    },
    {
      id: "cost-effective",
      title: "Cost-Effective Solutions",
      description:
        "Optimize your software investment and avoid unnecessary licensing and subscription costs.",
      icon: "optimize",
      imageSrc:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Business leaders discussing cost-effective software investments",
    },
    {
      id: "seamless-implementation",
      title: "Seamless Implementation",
      description:
        "Get support for installation, configuration, integration, and deployment for a smoother setup.",
      icon: "implement",
      imageSrc:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Team celebrating a successful software deployment",
    },
  ] satisfies SoftwareLandingCard[],
};

export const SOFTWARE_OUR_PROCESS: Features = {
  type: "features",
  anchorId: "process",
  variant: "value-cards",
  heading: "Our Process",
  subheading: "How we deliver exceptional software solutions",
  align: "center",
  gridColumns: 5,
  items: [
    {
      id: "consultation",
      title: "Consultation",
      description:
        "We analyze your business needs and objectives to recommend the most suitable software solutions.",
      icon: "user-friends",
    },
    {
      id: "licensing",
      title: "Licensing",
      description:
        "We help you procure the appropriate licenses at competitive prices with flexible options.",
      icon: "certificate",
    },
    {
      id: "implementation",
      title: "Implementation",
      description:
        "Our technical team ensures smooth installation and integration with your existing systems.",
      icon: "cogs",
    },
    {
      id: "training",
      title: "Training",
      description:
        "We provide comprehensive training to ensure your team can effectively use the software.",
      icon: "graduation-cap",
    },
    {
      id: "support",
      title: "Support",
      description: "Our support team is always available to assist with any issues or questions.",
      icon: "headset",
    },
  ],
};

export const SOFTWARE_TESTIMONIALS: Testimonials = {
  type: "testimonials",
  variant: "software-quotes",
  heading: "What Our Clients Say",
  subheading: "Hear from businesses that have transformed with our software solutions",
  items: [
    {
      id: "t1",
      quote:
        "The Autodesk solutions provided by Aptus Infotech have transformed our design process. The support and training we received were exceptional, and our team is now more productive than ever.",
      author: "Ahmed Hassan",
      role: "Design Director, Architecture Plus",
    },
    {
      id: "t2",
      quote:
        "The Oracle database implementation by Aptus Infotech has significantly improved our data management capabilities. The system is robust, secure, and perfectly integrated with our existing processes.",
      author: "Sara Al Said",
      role: "IT Manager, Financial Services Group",
    },
    {
      id: "t3",
      quote:
        "The educational software solutions provided by Aptus Infotech have revolutionized how our institution manages academic records and delivers online learning. It's been a game-changer for both teachers and students.",
      author: "Inayat Al Balushi",
      role: "Principal, Global Education Institute",
    },
  ],
};
