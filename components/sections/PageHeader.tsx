import { Container, CmsImage } from "@/components/ui";
import type { PageHeader as PageHeaderData } from "@/types";

interface PageHeaderProps {
  data: PageHeaderData;
}

export function PageHeader({ data }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-brand-navy" data-section="page-header">
      {data.media && (
        <>
          <CmsImage
            src={data.media.src}
            alt={data.media.alt || data.title || ""}
            fill
            className="object-cover opacity-25"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-dark/90 via-brand-navy/80 to-brand-navy/60" />
        </>
      )}
      <Container>
        <div className="relative z-10 py-20 lg:py-28">
          {data.title && (
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              {data.title}
            </h1>
          )}
          <span className="mt-5 block h-1 w-16 rounded-full bg-brand-green" />
          {data.subtitle && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
              {data.subtitle}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
