import { cn } from "@/lib/design-system/cn";
import type { CmsPresentationSettings } from "@/lib/design-system/presentation";
import { cmsPresentationClasses, cmsPresentationDataAttrs } from "@/lib/design-system/presentation";

type SectionBackground = "white" | "muted" | "primary" | "gradient";
type SectionSpacing = "standard" | "compact" | "featured";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: SectionBackground;
  spacing?: SectionSpacing;
  presentation?: CmsPresentationSettings;
};

const BACKGROUND_CLASS: Record<SectionBackground, string> = {
  white: "",
  muted: "aptus-live-section--muted",
  primary: "bg-aptus-primary text-white",
  gradient: "",
};

const SPACING_CLASS: Record<SectionSpacing, string> = {
  standard: "aptus-live-section",
  compact: "py-10",
  featured: "aptus-live-section",
};

export function Section({
  children,
  className,
  id,
  background = "white",
  spacing = "standard",
  presentation,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        SPACING_CLASS[spacing],
        BACKGROUND_CLASS[background],
        background === "gradient"
          ? "aptus-live-section"
          : undefined,
        presentation ? cmsPresentationClasses(presentation) : undefined,
        className,
      )}
      style={
        background === "gradient"
          ? {
              background:
                "linear-gradient(180deg, var(--aptus-live-muted) 0%, transparent 100%)",
            }
          : undefined
      }
      {...(presentation ? cmsPresentationDataAttrs(presentation) : {})}
    >
      {children}
    </section>
  );
}
