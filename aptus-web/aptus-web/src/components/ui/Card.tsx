import { cn } from "@/lib/design-system/cn";

type CardVariant = "standard" | "compact" | "featured";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
};

const VARIANT_CLASS: Record<CardVariant, string> = {
  standard: "rounded-aptus-lg border border-aptus-border bg-aptus-surface p-6 shadow-aptus",
  compact: "rounded-aptus border border-aptus-border bg-aptus-surface p-4 shadow-sm",
  featured:
    "rounded-pill border border-transparent bg-aptus-section p-8 text-center shadow-aptus transition hover:shadow-aptus-lg",
};

export function Card({ children, className, variant = "standard" }: CardProps) {
  return <div className={cn(VARIANT_CLASS[variant], className)}>{children}</div>;
}

type CardTitleProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn("text-aptus-xl font-semibold text-aptus-primary", className)}>{children}</h3>
  );
}

type CardBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <p className={cn("mt-3 text-aptus-sm leading-relaxed text-aptus-text-muted md:text-aptus-base", className)}>
      {children}
    </p>
  );
}
