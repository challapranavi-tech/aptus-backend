import { Button } from "@/components/ui/Button";

type ReadMoreButtonProps = {
  href: string;
  label?: string;
  variant?: "primary" | "secondary" | "cta" | "outline" | "outline-light";
};

/** Primary CTA link — matches live Elementor button. */
export function ReadMoreButton({ href, label = "Read More", variant = "primary" }: ReadMoreButtonProps) {
  if (variant === "primary") {
    return (
      <a href={href} className="aptus-live-btn">
        {label}
      </a>
    );
  }

  return (
    <Button href={href} variant={variant} size="md">
      {label}
    </Button>
  );
}
