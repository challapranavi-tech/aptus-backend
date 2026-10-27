/**
 * FAQ page from frontend/content/faq.json.
 * Ships on the frontend Vercel deploy without a backend/Odoo seed.
 */

import type { FAQ, Page } from "@/types";
import faqJson from "@/content/faq.json";

export function buildLocalFaqPage(): Page | null {
  const items = faqJson.items?.filter((item) => item.question && item.answer) ?? [];
  if (!faqJson.title || !items.length) return null;

  const data: FAQ = {
    type: "faq",
    heading: faqJson.title,
    items: items.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    })),
  };

  return {
    id: "local:faq",
    slug: "faq",
    title: faqJson.title,
    seo: {
      title: "FAQs | Aptus Infotech",
      description:
        "Answers to common questions about Aptus Infotech ELV systems, software solutions, installation, support, and technology projects.",
    },
    sections: [
      {
        id: "faq",
        type: "faq",
        order: 1,
        data,
      },
    ],
  };
}
