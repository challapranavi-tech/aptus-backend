"use client";

import { Container, CmsImage } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { FeatureRow as FeatureRowData } from "@/types";
import Link from "next/link";
import { useRef } from "react";

interface FeatureRowProps {
  data: FeatureRowData;
}

export function FeatureRow({ data }: FeatureRowProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRight = data.imagePosition === "right";
  const imageBelow = data.imagePosition === "below";
  const isBoxed = data.variant === "boxed";
  const isPanel = data.variant === "panel";
  const paragraphs =
    data.paragraphs ?? (data.description ? data.description.split(/\n\n+/) : []);

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.heading, data.media?.src, data.imagePosition, data.variant],
    setup() {
      const image = imageRef.current;
      const textBits = textRef.current?.querySelectorAll("[data-feature-animate]");

      if (image) {
        gsap.from(image, {
          clipPath: "inset(0 100% 0 0)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }

      if (textBits && textBits.length > 0) {
        gsap.from(textBits, {
          y: 28,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    },
  });

  const isIntro = Boolean(data.headingAsH1);
  const textColor = "text-black";
  const textStyle = { fontSize: 'var(--text-base)' } as const;

  const textBlock = (
    <div
      ref={textRef}
      className={cn(
        data.media && !imageBelow && (imageRight ? "lg:order-1 lg:pl-0" : "lg:order-2"),
      )}
    >
      {data.eyebrow && (
        <p data-feature-animate className="section-eyebrow mb-3">
          {data.eyebrow}
        </p>
      )}
      {(data.heading || data.headingAccent || data.headingAfter) && (
        <>
          {data.headingAsH1 ? (
            <h1
              data-feature-animate
              className="leading-snug text-brand-blue"
              style={{ fontSize: 'var(--text-5xl)', fontWeight: 600 }}
            >
              {data.heading}
              {data.heading && data.headingAccent && " "}
              {data.headingAccent && (
                <em className="font-semibold not-italic text-brand-blue">
                  <span className="italic">{data.headingAccent}</span>
                </em>
              )}
              {data.headingAfter && ` ${data.headingAfter}`}
            </h1>
          ) : (
            <h2
              data-feature-animate
              className={cn("leading-snug", isPanel ? "text-black" : "text-brand-navy")}
              style={{ fontSize: isPanel ? 'var(--text-xl)' : 'var(--text-4xl)', fontWeight: 600 }}
            >
              {data.heading}
              {data.heading && data.headingAccent && " "}
              {data.headingAccent && (
                <em className="font-semibold not-italic text-brand-blue">
                  <span className="italic">{data.headingAccent}</span>
                </em>
              )}
              {data.headingAfter && ` ${data.headingAfter}`}
            </h2>
          )}
        </>
      )}
      {paragraphs.map((para, i) => (
        <p
          key={i}
          data-feature-animate
          className={cn(
            "leading-[1.8]",
            textColor,
            i === 0 ? "mt-0" : "mt-5",
            !data.heading && i === 0 && "mt-0",
          )}
          style={textStyle}
        >
          {i === 1 && para.includes("WINNING TOGETHER") ? (
            <>
              <strong className="font-semibold text-[#475569]">
                {para.split(" is all about")[0]}
              </strong>
              {para.includes(" is all about") ? ` is all about${para.split(" is all about")[1]}` : para}
            </>
          ) : (
            para
          )}
        </p>
      ))}
      {data.bullets && data.bullets.length > 0 && (
        <ul className="mt-5 space-y-2 text-left">
          {data.bullets.map((b, i) => (
            <li
              key={i}
              data-feature-animate
              className="flex items-start gap-3 text-muted-foreground"
              style={{ fontSize: 'var(--text-base)' }}
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {data.action && (
        <div data-feature-animate className="mt-7">
          <Link href={data.action.href} className="btn-section">
            {data.action.label}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );

  const imageBlock =
    data.media && !imageBelow ? (
      <div
        ref={imageRef}
        className={cn(
          "relative",
          imageRight ? "lg:order-2" : "lg:pr-8",
          !imageRight && "lg:order-1",
        )}
      >
        <CmsImage
          src={data.media.src}
          alt={data.media.alt || data.heading || ""}
          width={data.media.width ?? 500}
          height={data.media.height ?? 410}
          className={cn(
            "h-auto w-full",
            isIntro && !imageRight && "w-full max-w-full lg:w-[73%] lg:max-w-[73%]",
            isBoxed && "mx-auto max-w-[500px] rounded-2xl object-cover shadow-[0_10px_25px_rgba(0,0,0,0.1)]",
            isPanel && "rounded-2xl object-cover shadow-[0_10px_30px_rgba(0,0,0,0.1)]",
            !isBoxed && !isPanel && "img-shrink object-cover",
          )}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    ) : null;

  return (
    <section
      ref={sectionRef}
      className={cn(
        "bg-white",
        isPanel ? "py-0" : "section-padding",
      )}
      data-section="feature-row"
      data-variant={data.variant ?? "default"}
    >
      <Container>
        <div
          className={cn(
            isBoxed && "aptus-tint-panel my-4 mb-8 p-4",
            isPanel && "aptus-tint-panel my-4 mb-8 p-4",
            data.media && !imageBelow && "grid items-center gap-10 lg:grid-cols-2 lg:gap-12",
          )}
        >
          {imageBlock}
          {textBlock}
          {data.media && imageBelow && (
            <div
              ref={imageRef}
              className="relative mt-10 overflow-hidden rounded-2xl shadow-[var(--shadow-lg)]"
            >
              <CmsImage
                src={data.media.src}
                alt={data.media.alt || data.heading || ""}
                width={data.media.width ?? 720}
                height={data.media.height ?? 1024}
                className="h-auto w-full object-contain"
                sizes="(max-width: 1024px) 100vw, 960px"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
