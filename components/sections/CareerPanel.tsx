import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CareerPanel as CareerPanelData } from "@/types/cms";

interface CareerPanelProps {
  data: CareerPanelData;
}

/** Career page intro — post-3441 white band. */
export function CareerPanel({ data }: CareerPanelProps) {
  return (
    <section className="section-padding bg-white" data-section="career-panel">
      <Container>
        {data.title && <h1 className="aptus-career-hero-title">{data.title}</h1>}
        {data.tagline && <p className="aptus-career-tagline">{data.tagline}</p>}
        {data.paragraphs?.map((p, i) => (
          <p key={i} className={cn("aptus-career-intro-text", i === 0 ? "mt-0" : "mt-4")}>
            {p}
          </p>
        ))}
      </Container>
    </section>
  );
}
