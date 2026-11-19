"use client";

import { useLocale } from "@/context/LocaleProvider";
import { copyForLocale } from "@/locales/shared-ar";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export function Loading({
  size = "md",
  label = "Loading",
  className,
  fullScreen = false,
}: LoadingProps) {
  const { locale } = useLocale();
  const text = copyForLocale(locale, label);
  const spinner = (
    <div
      role="status"
      aria-label={text}
      className={cn("flex flex-col items-center gap-3", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-muted border-t-primary",
          sizeClasses[size],
        )}
      />
      <span className="sr-only">{text}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
