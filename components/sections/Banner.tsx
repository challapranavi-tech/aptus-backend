"use client";

import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import type { Banner as BannerData } from "@/types";
import { CmsImage } from "@/components/ui";
import Link from "next/link";
import { useRef } from "react";

interface BannerProps {
  data: BannerData;
}

export function Banner({ data }: BannerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.media?.src],
    setup() {
      const image = imageWrapRef.current;
      const textLines = sectionRef.current?.querySelectorAll("[data-banner-animate]");
      if (!image) return;

      gsap.from(image, {
        scale: 1.08,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
      });

      if (textLines && textLines.length > 0) {
        gsap.from(textLines, {
          y: 28,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.15,
        });
      }
    },
  });

  if (!data.media) return null;

  const image = (
    <div ref={imageWrapRef} className="banner-image overflow-hidden">
      <CmsImage
        src={data.media.src}
        alt={data.media.alt || data.heading || ""}
        width={data.media.width ?? 1584}
        height={data.media.height ?? 396}
        className="h-auto w-full object-cover"
        priority
        sizes="100vw"
      />
    </div>
  );

  const content = (
    <>
      {image}
      {data.heading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-navy/40 px-6">
          <h1
            data-banner-animate
            className="max-w-4xl text-center text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl"
          >
            {data.heading}
          </h1>
        </div>
      )}
    </>
  );

  return (
    <section
      ref={sectionRef}
      className="relative mb-0 w-full overflow-hidden bg-white"
      data-section="banner"
    >
      {data.href ? (
        <Link href={data.href} aria-label={data.heading ?? "Banner"} className="relative block">
          {content}
        </Link>
      ) : (
        <div className="relative">{content}</div>
      )}
    </section>
  );
}
