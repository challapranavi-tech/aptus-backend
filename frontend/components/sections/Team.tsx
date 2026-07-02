import { Container, CmsImage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Team as TeamData } from "@/types";

interface TeamProps {
  data: TeamData;
}

export function Team({ data }: TeamProps) {
  const isLeadership = data.variant === "leadership";

  if (isLeadership) {
    return (
      <>
        {data.heading && (
          <section className="bg-white py-8" data-section="team-title">
            <Container>
              <h2 className="aptus-team-section-title">{data.heading}</h2>
            </Container>
          </section>
        )}

        {data.members && data.members.length > 0 && (
          <section className="bg-white pb-16 pt-0" data-section="team" data-variant="leadership">
            <Container>
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
                {data.members.map((m) => (
                  <article key={m.id} className="aptus-tint-panel p-4">
                    <div className="grid items-start gap-4 sm:grid-cols-2">
                      <div className="min-w-0">
                        {m.name && <h3 className="aptus-team-member-name">{m.name}</h3>}
                        {m.role && <p className="aptus-team-member-role mt-1">{m.role}</p>}
                        {m.bio && (
                          <p className="aptus-team-member-bio mt-4 whitespace-pre-line">{m.bio}</p>
                        )}
                      </div>
                      {m.avatar && (
                        <div className="relative lg:mt-20">
                          <CmsImage
                            src={m.avatar.src}
                            alt={m.avatar.alt || m.name || ""}
                            width={480}
                            height={544}
                            className="h-auto w-full object-cover"
                            sizes="(max-width: 1024px) 100vw, 240px"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        )}
      </>
    );
  }

  return (
    <section className="section-padding bg-white" data-section="team">
      <Container>
        {(data.eyebrow || data.heading || data.subheading) && (
          <div className="mb-12 text-center">
            {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
            {data.heading && (
              <h2 className="text-3xl font-semibold text-brand-navy sm:text-4xl">{data.heading}</h2>
            )}
            {data.subheading && (
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                {data.subheading}
              </p>
            )}
            <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-brand-blue" />
          </div>
        )}

        {data.members && data.members.length > 0 && (
          <div className="mx-auto flex max-w-4xl flex-col gap-8">
            {data.members.map((m) => (
              <article
                key={m.id}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-col sm:flex-row">
                  {m.avatar && (
                    <div className="relative h-56 w-full shrink-0 overflow-hidden bg-brand-light sm:h-auto sm:w-52 md:w-60">
                      <CmsImage
                        src={m.avatar.src}
                        alt={m.avatar.alt || m.name || ""}
                        width={240}
                        height={300}
                        className="h-full w-full object-cover"
                        sizes="(max-width: 640px) 100vw, 240px"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-center p-6 text-center sm:text-left">
                    {m.name && (
                      <h3 className="text-lg font-semibold text-brand-navy">{m.name}</h3>
                    )}
                    {m.role && (
                      <p className="mt-1 text-sm font-medium text-brand-green">{m.role}</p>
                    )}
                    {m.bio && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
