import type { AutodeskProductContent } from "@/types/autodesk-product";

type AutodeskProductJsonLdProps = {
  product: AutodeskProductContent;
  baseUrl?: string;
};

export function AutodeskProductJsonLd({
  product,
  baseUrl = "https://aptusinfotech.com",
}: AutodeskProductJsonLdProps) {
  const url = `${baseUrl}/${product.slug}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription ?? product.productDescription,
    url,
    brand: {
      "@type": "Brand",
      name: "Autodesk",
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Aptus Infotech",
        url: baseUrl,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Software", item: `${baseUrl}/software` },
      { "@type": "ListItem", position: 3, name: "Autodesk", item: `${baseUrl}/autodesk` },
      { "@type": "ListItem", position: 4, name: product.name, item: url },
    ],
  };

  const faqSchema =
    product.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: product.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  const schemas = [productSchema, breadcrumbSchema, faqSchema].filter(Boolean);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.length === 1 ? schemas[0] : schemas) }}
    />
  );
}
