import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "site" | "2xl" | "full";

interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  size?: ContainerSize;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-[var(--container-sm)]",
  md: "max-w-[var(--container-md)]",
  lg: "max-w-[var(--container-lg)]",
  xl: "max-w-[var(--container-xl)]",
  site: "max-w-[var(--container-site)]",
  "2xl": "max-w-[var(--container-2xl)]",
  full: "max-w-full",
};

export function Container({
  size = "site",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-5 lg:px-6",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
