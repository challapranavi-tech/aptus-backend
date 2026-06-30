import { cn } from "@/lib/design-system/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  size?: "content" | "narrow" | "wide";
  as?: "div" | "section" | "article";
};

const SIZE_CLASS = {
  content: "aptus-live-container",
  narrow: "mx-auto w-full max-w-narrow px-[var(--aptus-content-padding-x)]",
  wide: "mx-auto w-full max-w-wide px-[var(--aptus-content-padding-x)]",
} as const;

export function Container({
  children,
  className,
  size = "content",
  as: Tag = "div",
}: ContainerProps) {
  return <Tag className={cn(SIZE_CLASS[size], className)}>{children}</Tag>;
}
