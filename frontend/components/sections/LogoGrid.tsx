import { Container, CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { LogoGrid as LogoGridData } from "@/types";

interface LogoGridProps {
  data: LogoGridData;
}

export function LogoGrid({ data }: LogoGridProps) {
  if (!data.items || data.items.length === 0) return null;

  const isAlliances = data.variant === "alliances";
  const isAlliancesGrid = data.variant === "alliances-grid";
  const isPartnersMarquee = data.variant === "partners-marquee";

  if (isPartnersMarquee) {
    return (
      <section
        className="home-partners section-padding"
        data-section="logo-grid"
        data-variant="partners-marquee"
      >
        <Container>
          {(data.heading || data.headingAccent) && (
            <h2 className="home-partners__heading">
              {data.heading}
              {data.heading && data.headingAccent ? " " : null}
              {data.headingAccent}
            </h2>
          )}
        </Container>
        <div
          className="home-partners__marquee"
          role="region"
          aria-roledescription="carousel"
          aria-label={data.heading ?? "Authorized technology partners"}
        >
          <div className="home-partners__track">
            {[...data.items, ...data.items].map((logo, i) => (
              <div key={`${logo.id}-${i}`} className="home-partners__slide">
                <span className="home-partners__name">{logo.alt}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        isAlliances || isAlliancesGrid ? "bg-white py-4 sm:py-5" : "section-padding bg-brand-light",
      )}
      data-section="logo-grid"
      data-variant={data.variant ?? "default"}
    >
      <Container>
        {(data.eyebrow || data.heading || data.headingAccent) && (
          <div className={cn(isAlliances || isAlliancesGrid ? "mb-0" : "mb-10 text-center")}>
            {data.eyebrow && <p className="eyebrow mb-3 text-center">{data.eyebrow}</p>}
            {(data.heading || data.headingAccent) && (
              <h2
                className={cn(isAlliances || isAlliancesGrid ? "aptus-alliances-heading" : "text-brand-navy")}
                style={!(isAlliances || isAlliancesGrid) ? { fontSize: "var(--text-4xl)", fontWeight: 600 } : undefined}
              >
                {data.heading}
                {data.heading && data.headingAccent && " "}
                {data.headingAccent && (
                  <span
                    className={
                      isAlliances || isAlliancesGrid
                        ? "aptus-alliances-heading-accent"
                        : "text-[#38b6ff]"
                    }
                  >
                    {data.headingAccent}
                  </span>
                )}
              </h2>
            )}
            {!isAlliances && !isAlliancesGrid && (
              <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-brand-blue" />
            )}
          </div>
        )}

        {isAlliancesGrid && (
          <div className="aptus-alliances-grid">
            {data.items.map((logo) => (
              <div key={logo.id} className="aptus-alliance-card">
                <CmsImage
                  src={logo.src}
                  alt={logo.alt}
                  width={300}
                  height={180}
                  className="aptus-alliance-logo"
                  sizes="120px"
                />
              </div>
            ))}
          </div>
        )}

        {!isAlliances && !isAlliancesGrid && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {data.items.map((logo) => (
              <div
                key={logo.id}
                className="flex h-24 items-center justify-center rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <CmsImage
                  src={logo.src}
                  alt={logo.alt}
                  width={300}
                  height={180}
                  className="max-h-[50px] w-auto max-w-[80px] object-contain"
                  sizes="80px"
                />
              </div>
            ))}
          </div>
        )}
      </Container>

      {isAlliances && (
        <div
          className="aptus-alliance-marquee"
          role="region"
          aria-roledescription="carousel"
          aria-label="Strategic alliance partners"
        >
          <div className="aptus-alliance-marquee__track">
            {[...data.items, ...data.items].map((logo, i) => (
              <div key={`${logo.id}-${i}`} className="aptus-alliance-marquee__slide">
                <div className="aptus-alliance-card">
                  <CmsImage
                    src={logo.src}
                    alt={logo.alt}
                    width={300}
                    height={180}
                    className="aptus-alliance-logo"
                    sizes="220px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
