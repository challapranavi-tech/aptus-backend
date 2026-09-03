import type { Metadata } from "next";

export type AdobeMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
  alt?: string;
};

export type AdobeDestinationSection = {
  eyebrow?: string;
  heading: string;
  body: string;
  media?: AdobeMedia;
  /** Extra photos/videos in a grid (same assets adobe.com uses on these pages). */
  gallery?: AdobeMedia[];
  tone?: "light" | "dark" | "gray";
};

export type AdobeDestinationConfig = {
  slug: string;
  path: string;
  metadata: Metadata;
  icon: string;
  iconAlt: string;
  eyebrow: string;
  title: string;
  body: string[];
  heroTone: "dark" | "light" | "red";
  heroMedia?: AdobeMedia;
  sections: AdobeDestinationSection[];
};

/**
 * Destination pages for the five /adobe homepage pods.
 * Copy + media sourced from adobe.com category pages / homepage pods
 * (Creative Cloud, Firefly, Acrobat, Business, Students).
 */
export const ADOBE_DESTINATIONS: Record<string, AdobeDestinationConfig> = {
  "creative-cloud": {
    slug: "creative-cloud",
    path: "/adobe/creative-cloud",
    metadata: {
      title: "Creative Cloud | Adobe",
      description:
        "Photoshop, Illustrator, Premiere, and much more. Work with the tools behind the world’s most iconic creative content.",
    },
    icon: "/adobe-assets/creative-cloud.svg",
    iconAlt: "Adobe Creative Cloud",
    eyebrow: "Creative Cloud",
    title: "Create at the highest level.",
    body: [
      "Photoshop, Illustrator, Premiere, and much more. Work with the tools behind the world’s most iconic creative content.",
      "Save 50% on Creative Cloud Pro for the first three months. New subscribers only.",
    ],
    heroTone: "dark",
    heroMedia: {
      type: "video",
      src: "https://www.adobe.com/upp/media_12b79042476ff5306e627654877c58085eacf9cf0.mp4",
      poster:
        "https://www.adobe.com/upp-shared/media_15d0c67d468c6ab860bd67d3af2d0998c15f45bbc.webp?width=2000&format=webply&optimize=medium",
    },
    sections: [
      {
        eyebrow: "Creativity and design",
        heading: "Create with the top tools.",
        body: "Do it all with industry-leading apps for design, photo, video, and creative AI.",
        media: {
          type: "video",
          src: "https://www.adobe.com/upp/media_1badc9f153c69f16292c23f9752012c9ab7edb851.mp4",
          poster:
            "https://www.adobe.com/upp-shared/media_123c15ca5b250c113b7f1027f0513ea6226f725cc.png?width=2000&format=webply&optimize=medium",
        },
        tone: "light",
      },
      {
        heading: "Everything you need to make anything.",
        body: "Whether you’re a student, social influencer, creative professional, performance marketer, or global brand, Adobe has the apps you need to make it happen.",
        gallery: [
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_1dddcf68e4f8faee75c049540af63a1d8665eef63.png?width=2000&format=webply&optimize=medium",
            alt: "Photoshop",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_1a019b385c3351c3d1bc776b3847795e8052dbe7d.png?width=2000&format=webply&optimize=medium",
            alt: "Illustrator",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_192364a2460d346d635169225d1a899bd7ded0fb5.png?width=2000&format=webply&optimize=medium",
            alt: "Premiere",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_154cf82df7f4b5adf9cbf8ba16e799bc802b464c7.png?width=2000&format=webply&optimize=medium",
            alt: "Creative Cloud",
          },
        ],
        tone: "gray",
      },
      {
        heading: "One place to make anything.",
        body: "Get 20+ apps, including Photoshop, Illustrator, Premiere Pro, and Acrobat Pro.",
        media: {
          type: "image",
          src: "https://www.adobe.com/upp-shared/media_154cf82df7f4b5adf9cbf8ba16e799bc802b464c7.png?width=2000&format=webply&optimize=medium",
          alt: "Creative Cloud apps",
        },
        tone: "light",
      },
    ],
  },

  firefly: {
    slug: "firefly",
    path: "/adobe/firefly",
    metadata: {
      title: "Adobe Firefly | Generative AI for creatives",
      description:
        "Generate and edit images, video, audio, and designs using top AI models from Adobe, Google, OpenAI, and more.",
    },
    icon: "/adobe-assets/firefly-appicon-256.svg",
    iconAlt: "Adobe Firefly",
    eyebrow: "Firefly",
    title: "Adobe Firefly. Create stunning content faster.",
    body: [
      "Generate and edit images, video, audio, and designs using top AI models from Adobe, Google, OpenAI, Kling AI, and more.",
      "Get unlimited generations on select models for the first year. And save on our biggest Firefly plans until August 26.",
    ],
    heroTone: "dark",
    heroMedia: {
      type: "video",
      src: "https://www.adobe.com/upp/media_1b79b8d240c8d6ea3dd5235f681a2bea24f0c5582.mp4",
      poster:
        "https://www.adobe.com/upp-shared/media_180a8327664c8013005414b32d539cb95ce16ef7a.webp?width=2000&format=webply&optimize=medium",
    },
    sections: [
      {
        eyebrow: "Content creation",
        heading: "Generate stunning content easily.",
        body: "Quickly create and edit images, video, and audio with creative AI.",
        media: {
          type: "video",
          src: "https://www.adobe.com/upp/media_159d163e5e983109aed71b1cb4e1048b4f849ab72.mp4",
          poster:
            "https://www.adobe.com/upp-shared/media_182beb06b779224bc280f16b61d7e49d21fe49b1b.png?width=2000&format=webply&optimize=medium",
        },
        tone: "light",
      },
      {
        eyebrow: "Features",
        heading: "Top Firefly features.",
        body: "The industry-leading generative AI tools for images, video, audio, and vectors are in the Firefly app.",
        media: {
          type: "image",
          src: "https://www.adobe.com/products/media_1912d2dfb102c668252eb9dda176f925d677fc5e2.png",
          alt: "Adobe Firefly",
        },
        gallery: [
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_177ad1e4e1f2ff11992428f533093c4766d7e730a.png?width=2000&format=webply&optimize=medium",
            alt: "Create with Firefly",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_1179a8d50eb3482a8ef9a6fcb0ce35db8e25d43e2.png?width=2000&format=webply&optimize=medium",
            alt: "Photoshop AI",
          },
        ],
        tone: "dark",
      },
      {
        eyebrow: "Flexibility",
        heading: "Firefly is for everyone.",
        body: "From generating podcast thumbnails and graphics to prototyping complete brand campaigns, Firefly has the AI models and design tools you need to go from initial idea to final product.",
        tone: "light",
      },
      {
        heading: "All the best models, all in one place.",
        body: "Adobe Firefly. Your AI-powered creative space.",
        media: {
          type: "image",
          src: "https://www.adobe.com/upp-shared/media_177ad1e4e1f2ff11992428f533093c4766d7e730a.png?width=2000&format=webply&optimize=medium",
          alt: "Firefly creative space",
        },
        tone: "gray",
      },
    ],
  },

  acrobat: {
    slug: "acrobat",
    path: "/adobe/acrobat",
    metadata: {
      title: "Adobe Acrobat | Create and edit PDFs with AI",
      description:
        "Create, edit, share and sign documents with trusted PDF tools. Use AI to make easy edits, get answers, and create polished content.",
    },
    icon: "/adobe-assets/acrobat-pro.svg",
    iconAlt: "Adobe Acrobat",
    eyebrow: "Acrobat",
    title: "Do more with Acrobat.",
    body: [
      "With Adobe Acrobat Pro + AI Assistant Plus, you have trusted tools to edit and sign PDFs, generate presentations, and understand your docs faster.",
      "Create, edit, share and sign documents with trusted PDF tools. Use AI to make easy edits, get answers, share information, and create polished content.",
    ],
    heroTone: "light",
    heroMedia: {
      type: "video",
      src: "https://images-tv.adobe.com/videoBackgrounds/acrobat/2026_Q2_AcrobatOverviewMarquee_1920x1120_1.mp4",
      poster: "https://www.adobe.com/acrobat/media_14da7a4ea109e868041eecca664e1538d41f5beb4.png",
    },
    sections: [
      {
        eyebrow: "PDF and document essentials",
        heading: "Do it all in less time.",
        body: "Create, edit, and share PDFs. Make edits and create presentations with AI.",
        media: {
          type: "video",
          src: "https://www.adobe.com/upp/media_1928dd1a3e8e5ed6e7979b5bb37fcd4c273746e62.mp4",
          poster:
            "https://www.adobe.com/upp-shared/media_1d243344be7183a3379b1c3c6ae6d023587ccdd18.png?width=2000&format=webply&optimize=medium",
        },
        tone: "light",
      },
      {
        heading: "Trusted PDF tools, enhanced with AI.",
        body: "Work smarter with the essential PDF toolkit to edit, convert, and sign your files using AI Assistant, so you can complete more in less time.",
        media: {
          type: "image",
          src: "https://www.adobe.com/upp-shared/media_1824349e98ea332d56e0c46ad3885f15f81e81d9c.png?width=2000&format=webply&optimize=medium",
          alt: "Adobe Acrobat",
        },
        gallery: [
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_11baea9af9d1d1306f14797ab9e4566c1620ecc11.png?width=2000&format=webply&optimize=medium",
            alt: "Acrobat PDF Space",
          },
          {
            type: "image",
            src: "https://www.adobe.com/acrobat/media_14da7a4ea109e868041eecca664e1538d41f5beb4.png",
            alt: "Do more with Acrobat",
          },
        ],
        tone: "gray",
      },
      {
        heading: "Unlock next-level productivity with AI Assistant.",
        body: "Bring all your project files, PDFs, and links together into a shareable, interactive PDF Space for smarter and faster collaboration. Less busywork. More meaningful work.",
        tone: "light",
      },
      {
        heading: "Create fresh content fast.",
        body: "Transform your files into polished presentations, social media posts, and more with Adobe Express tools included in Acrobat Studio.",
        media: {
          type: "image",
          src: "https://www.adobe.com/upp-shared/media_11baea9af9d1d1306f14797ab9e4566c1620ecc11.png?width=2000&format=webply&optimize=medium",
          alt: "Create content with Acrobat",
        },
        tone: "gray",
      },
      {
        heading: "Get work done. Faster.",
        body: "Acrobat. It’s how over 5 million companies get work done.",
        tone: "light",
      },
    ],
  },

  business: {
    slug: "business",
    path: "/adobe/business",
    metadata: {
      title: "Adobe for Business",
      description:
        "Unify data, content, and workflows with Adobe AI to move faster, personalize at scale, and prove impact across your business.",
    },
    icon: "/adobe-assets/experience-cloud-logo.svg",
    iconAlt: "Adobe Experience Cloud",
    eyebrow: "Adobe for Business",
    title: "Orchestrate customer experiences with AI.",
    body: [
      "Unify data, content, and workflows with Adobe AI to move faster, personalize at scale, and prove impact across your business.",
    ],
    heroTone: "dark",
    heroMedia: {
      type: "video",
      src: "https://www.adobe.com/upp/media_1fa8617c753dadad2b5de772c544a1091570c94b4.mp4",
      poster:
        "https://www.adobe.com/upp-shared/media_117290bb35cebd4038b07dd09d84f6b7bb026c5e9.webp?width=2000&format=webply&optimize=medium",
    },
    sections: [
      {
        eyebrow: "Adobe for Business",
        heading: "Orchestrate customer experiences.",
        body: "Deliver business impact, move faster, and personalize at scale.",
        media: {
          type: "video",
          src: "https://www.adobe.com/upp/media_14d261ad034b647cf9ec9e77e1a4e53cbbd31af35.mp4",
          poster:
            "https://www.adobe.com/upp-shared/media_1f42c38b1bfa9847b0a51aae46ad3d988f261f566.png?width=2000&format=webply&optimize=medium",
        },
        tone: "light",
      },
      {
        heading: "It starts with Adobe.",
        body: "Adobe solutions integrate our best-in-class products to help you tackle pressing business challenges.",
        gallery: [
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_1f81c5db554aa9ec0e514f9d3cb5ea60dc2b41353.png?width=2000&format=webply&optimize=medium",
            alt: "GenStudio",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_16a12df2eb12e5db3e1b23402493892b912e73c49.png?width=2000&format=webply&optimize=medium",
            alt: "Business Products",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_1ffc572777c63f4a753a7ac51b7a94bd275e98cd7.png?width=2000&format=webply&optimize=medium",
            alt: "Adobe Brand Visibility",
          },
        ],
        tone: "gray",
      },
      {
        heading: "Scale your content supply chain.",
        body: "Unify creative, marketing, and document workflows so teams move faster and prove impact across the business.",
        media: {
          type: "image",
          src: "https://www.adobe.com/upp-shared/media_1f81c5db554aa9ec0e514f9d3cb5ea60dc2b41353.png?width=2000&format=webply&optimize=medium",
          alt: "GenStudio content supply chain",
        },
        tone: "light",
      },
    ],
  },

  students: {
    slug: "students",
    path: "/adobe/students",
    metadata: {
      title: "Creative Cloud for students and teachers | Adobe",
      description:
        "Save big on industry-standard tools. Create designs, videos, presentations, and more — while building skills for your future.",
    },
    icon: "/adobe-assets/creative-cloud.svg",
    iconAlt: "Adobe Creative Cloud",
    eyebrow: "Students and teachers",
    title: "Students and teachers save big.",
    body: [
      "Save over 60% on Creative Cloud with valid school credentials.",
      "Save a bundle on our biggest bundle of top industry creative tools.",
    ],
    heroTone: "red",
    heroMedia: {
      type: "video",
      src: "https://www.adobe.com/upp/media_172ab3221a924e6451f0eeae9224a41c84f93724e.mp4",
      poster:
        "https://www.adobe.com/education/students/media_14a141cf8900a74105b7122f28472dce9fd8cf872.jpg",
    },
    sections: [
      {
        eyebrow: "Students and teachers",
        heading: "See what you can make with Creative Cloud Pro.",
        body: "Edit images for flyers and posters. Study smarter with your docs. Visualize your ideas in seconds. Design stylish logos and graphics. Create memorable videos and films.",
        media: {
          type: "video",
          src: "https://main--edu--adobecom.aem.page/edu-shared/assets/video/ste/media_111ab4a9910f37559e7958a2654915be949cbbd55.mp4",
          poster:
            "https://www.adobe.com/upp-shared/media_196fcd7a65634001581d6dede382ee51d1608c74f.png?width=2000&format=webply&optimize=medium",
        },
        gallery: [
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_1dddcf68e4f8faee75c049540af63a1d8665eef63.png?width=2000&format=webply&optimize=medium",
            alt: "Photoshop — edit images for flyers and posters",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_1824349e98ea332d56e0c46ad3885f15f81e81d9c.png?width=2000&format=webply&optimize=medium",
            alt: "Acrobat — study smarter with your docs",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_177ad1e4e1f2ff11992428f533093c4766d7e730a.png?width=2000&format=webply&optimize=medium",
            alt: "Firefly — visualize your ideas in seconds",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_1a019b385c3351c3d1bc776b3847795e8052dbe7d.png?width=2000&format=webply&optimize=medium",
            alt: "Illustrator — design stylish logos and graphics",
          },
          {
            type: "image",
            src: "https://www.adobe.com/upp-shared/media_192364a2460d346d635169225d1a899bd7ded0fb5.png?width=2000&format=webply&optimize=medium",
            alt: "Premiere — create memorable videos and films",
          },
        ],
        tone: "light",
      },
      {
        heading: "What’s included in Creative Cloud Pro?",
        body: "Apps for everything. Loads of perks. Plus, Firefly generative AI features for creating images with simple text prompts.",
        tone: "gray",
      },
      {
        heading: "Creative Cloud Pro is more than just great apps.",
        body: "Tutorials, fonts, and stock images. Generative AI tools. Creative community. Learn, create, and grow your skills to advance your career.",
        media: {
          type: "image",
          src: "https://www.adobe.com/education/students/media_14a141cf8900a74105b7122f28472dce9fd8cf872.jpg",
          alt: "Students creating with Creative Cloud",
        },
        tone: "light",
      },
    ],
  },
};

export const ADOBE_DESTINATION_SLUGS = Object.keys(ADOBE_DESTINATIONS);
