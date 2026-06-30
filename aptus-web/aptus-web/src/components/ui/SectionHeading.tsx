import { cn } from "@/lib/design-system/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title?: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function SectionHeading({
  eyebrow,
  title,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={cn(ALIGN_CLASS[align], className)}>
      {eyebrow ? (
        <p className="aptus-live-eyebrow">{eyebrow}</p>
      ) : null}
      {title ? (
        <h2
          className={cn(
            "aptus-live-title",
            eyebrow && "mt-2",
          )}
        >
          {title}
        </h2>
      ) : null}
    </div>
  );
}

export function AccentSpan({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <em className={cn("aptus-accent not-italic text-aptus-primary", className)}>{children}</em>;
}
