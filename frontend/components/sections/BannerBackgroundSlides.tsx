"use client";

import { cn, resolveCmsImageSrc } from "@/lib/utils";
import type { MediaAsset } from "@/types";
import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDE_MS = 5200;

interface BannerBackgroundSlidesProps {
  images: MediaAsset[];
}

export function BannerBackgroundSlides({ images }: BannerBackgroundSlidesProps) {
  const [active, setActive] = useState(0);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotionOk(!reduce);
    if (images.length < 2 || reduce) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [images.length]);

  if (!images.length) return null;

  return (
    <div className="aptus-software-page-banner__slides" aria-hidden="true">
      {images.map((img, i) => (
        <div
          key={`${img.src}-${i}`}
          className={cn(
            "aptus-software-page-banner__slide",
            i === active && "is-active",
            motionOk && "has-motion",
          )}
        >
          <Image
            src={resolveCmsImageSrc(img.src)}
            alt=""
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
            unoptimized
          />
        </div>
      ))}
      <div className="aptus-software-page-banner__veil" />
    </div>
  );
}
