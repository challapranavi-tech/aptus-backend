import { Container } from "@/components/ui";
import type { Contact as ContactData } from "@/types";

interface ContactProps {
  data: ContactData;
}

function Row({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
        {icon}
      </span>
      <span className="pt-2 text-base leading-relaxed text-muted-foreground">{label}</span>
    </div>
  );
  return href ? (
    <a href={href} className="block transition-colors hover:text-brand-green">
      {content}
    </a>
  ) : (
    content
  );
}

/** Live `/contact-us` top band — post-3421. */
function ContactPageInfo({ data }: { data: ContactData }) {
  return (
    <section className="section-padding bg-white" data-section="contact">
      <Container className="max-w-[850px]">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            {data.heading && <h1 className="aptus-contact-info-heading">{data.heading}</h1>}
            <div className="aptus-contact-info-lines">
              {data.address && (
                <p>
                  <span aria-hidden="true">📍 </span>
                  {data.address}
                </p>
              )}
              {data.email && (
                <p>
                  <span aria-hidden="true">✉️ </span>
                  Email:{" "}
                  <a href={`mailto:${data.email}`} className="hover:text-brand-blue">
                    {data.email}
                  </a>
                </p>
              )}
              {data.phone && (
                <p>
                  <span aria-hidden="true">📞 </span>
                  Phone:{" "}
                  <a href={`tel:${data.phone.replace(/\s/g, "")}`} className="hover:text-brand-blue">
                    {data.phone}
                  </a>
                </p>
              )}
            </div>
          </div>

          {data.mapEmbedUrl && (
            <div className="overflow-hidden">
              <iframe
                src={data.mapEmbedUrl}
                title="Location map"
                className="h-80 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

export function Contact({ data }: ContactProps) {
  if (data.variant === "contact-page") {
    return <ContactPageInfo data={data} />;
  }

  return (
    <section className="section-padding bg-white" data-section="contact">
      <Container>
        {(data.eyebrow || data.heading || data.description) && (
          <div className="mb-12 max-w-2xl">
            {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
            {data.heading && (
              <h2 className="text-3xl font-semibold text-brand-navy sm:text-4xl">
                {data.heading}
              </h2>
            )}
            <span className="mt-4 block h-1 w-14 rounded-full bg-brand-green" />
            {data.description && (
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                {data.description}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            {data.phone && (
              <Row
                href={`tel:${data.phone.replace(/\s/g, "")}`}
                label={data.phone}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6.13 6.13l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
              />
            )}
            {data.email && (
              <Row
                href={`mailto:${data.email}`}
                label={data.email}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                }
              />
            )}
            {data.address && (
              <Row
                label={data.address}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                }
              />
            )}
          </div>

          {data.mapEmbedUrl && (
            <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)]">
              <iframe
                src={data.mapEmbedUrl}
                title="Location map"
                className="h-80 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
