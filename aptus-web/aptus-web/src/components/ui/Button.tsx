import Link from "next/link";
import { cn } from "@/lib/design-system/cn";

type ButtonVariant = "primary" | "secondary" | "cta" | "outline" | "outline-light" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-aptus-primary text-white hover:bg-aptus-primary-hover focus-visible:ring-aptus-amber",
  secondary:
    "bg-aptus-green text-white hover:bg-aptus-green-hover focus-visible:ring-aptus-amber",
  cta: "bg-aptus-amber text-black hover:brightness-95 focus-visible:ring-aptus-primary",
  outline:
    "border-2 border-aptus-primary bg-transparent text-aptus-primary hover:bg-aptus-primary hover:text-white",
  "outline-light":
    "border-2 border-white bg-transparent text-white hover:bg-white hover:text-aptus-primary",
  ghost: "bg-transparent text-aptus-primary hover:bg-aptus-section",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-aptus-sm",
  md: "px-6 py-2.5 text-aptus-sm",
  lg: "px-8 py-3 text-aptus-base",
};

const BASE_CLASS =
  "inline-flex items-center justify-center rounded-aptus font-medium transition-colors duration-aptus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aptus-amber focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45";

type ButtonLinkProps = {
  href: string;
  external?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

type ButtonElementProps = {
  href?: undefined;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

export type ButtonProps = ButtonLinkProps | ButtonElementProps;

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], className);
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = buttonClasses(variant, size, className);

  if ("href" in props && props.href) {
    const external =
      props.external ?? (props.href.startsWith("http") || props.href.startsWith("mailto:"));

    if (external) {
      return (
        <a
          href={props.href}
          className={classes}
          {...(props.href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", disabled, onClick } = props as ButtonElementProps;

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
