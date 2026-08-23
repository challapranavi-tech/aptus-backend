"use client";

import { CareerApplicationForm } from "@/components/sections/CareerApplicationForm";
import { ContactLeadForm } from "@/components/contact/ContactLeadForm";
import { SoftwareQuoteForm } from "@/components/quote/SoftwareQuoteForm";
import { quoteContextFromPathname } from "@/components/quote/quote-modal-utils";
import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { CTA as CTAData } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

interface CTAProps {
  data: CTAData;
}

function formClasses(layout: CTAData["layout"]) {
  const isLight = layout === "light";
  const isCareer = layout === "career";
  const isContactPage = layout === "contact-page";
  const isSoftwareMid = layout === "software-mid";
  const useCareerFields = isCareer || isContactPage;
  return {
    label: cn(
      useCareerFields ? "aptus-career-form-label" : "aptus-form-label",
      !isLight && !useCareerFields && "text-white/90",
    ),
    input: cn(
      "mt-0 w-full px-4 py-3",
      useCareerFields
        ? "aptus-career-form-input"
        : isLight
          ? "aptus-form-input"
          : "rounded-lg border-0 bg-white/10 text-white placeholder:text-white/50",
    ),
    submit: cn(
      isLight || useCareerFields
        ? "aptus-form-submit"
        : "btn-section !w-auto w-full rounded-lg px-6 py-3.5 text-white",
    ),
  };
}

function CtaForm({ data }: { data: CTAData }) {
  const variant = data.formVariant ?? "simple";
  const fc = formClasses(data.layout);
  const pathname = usePathname() ?? "/";
  const quote = quoteContextFromPathname(pathname);

  if (variant === "career") {
    return <CareerApplicationForm submitLabel={data.submitLabel} />;
  }

  if (variant === "software-quote") {
    return (
      <SoftwareQuoteForm
        data-cta-animate
        submitLabel={data.submitLabel ?? "Submit Now"}
        category={data.category ?? quote.category}
        productLabel={quote.productLabel}
        products={quote.products}
        defaultProduct={data.productName ?? quote.defaultProduct}
      />
    );
  }

  if (variant === "contact") {
    return (
      <ContactLeadForm
        variant={data.layout === "contact-page" ? "contact-page" : "contact"}
        submitLabel={
          data.submitLabel ??
          (data.layout === "contact-page" ? "Submit Now" : "Send Message")
        }
        labelClassName={fc.label}
        inputClassName={fc.input}
        submitClassName={fc.submit}
      />
    );
  }

  return (
    <ContactLeadForm
      variant="simple"
      submitLabel={data.submitLabel ?? "Submit Now"}
      labelClassName={fc.label}
      inputClassName={fc.input}
      submitClassName={fc.submit}
      category={data.category}
      productName={data.productName}
    />
  );
}

export function CTA({ data }: CTAProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isLight = data.layout === "light";
  const isCareer = data.layout === "career";
  const isContactPage = data.layout === "contact-page";
  const isSoftwareMid = data.layout === "software-mid";
  const isSoftwareQuote = data.formVariant === "software-quote";

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.heading, data.description, data.showForm, data.formVariant, data.layout],
    setup() {
      const panel = innerRef.current;
      if (!panel) return;

      // ponytail: software mid-CTA + mint contact band must render without scroll-trigger fade
      const isSoftwarePage = sectionRef.current?.closest(".aptus-software-page");
      if (isSoftwareMid || (isLight && isSoftwarePage)) return;

      gsap.from(panel, {
        y: 20,
        opacity: 0,
        scale: 0.98,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: panel, start: "top 88%", once: true },
      });

      const children = panel.querySelectorAll("[data-cta-animate]");
      if (children.length > 0) {
        gsap.from(children, {
          y: 16,
          opacity: 0,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.12,
          scrollTrigger: { trigger: panel, start: "top 88%", once: true },
        });
      }
    },
  });

  // Light contact CTAs were suppressed because the quote modal owns the form UX.
  // After removing top "Request a Quote" buttons, pages without a mid-band CTA
  // would have no quote entry point — render a bottom Request Quote button instead.
  if (isLight) {
    const quoteLabel =
      data.formVariant === "software-quote" ||
      data.heading?.trim().toLowerCase() === "request a quote"
        ? "Request a Quote"
        : data.action?.label &&
            data.action.label !== "Contact Us" &&
            data.action.label.trim()
          ? data.action.label
          : "Request a Quote";
    const quoteHref =
      data.action?.href?.startsWith("#") ||
      data.action?.href?.toLowerCase().includes("popup")
        ? (data.action.href as string)
        : "#form";
    const heading =
      data.heading?.trim().toLowerCase() === "have questions? we can help"
        ? "Request a Quote"
        : (data.heading ?? "Request a Quote");
    const description =
      data.description?.toLowerCase().includes("fill out the form")
        ? "Tell us what you need and our sales team will get back to you shortly."
        : data.description;

    return (
      <section
        ref={sectionRef}
        id="Form"
        className="aptus-software-mid-band"
        data-section="cta"
        data-layout="software-mid"
      >
        <div className="aptus-live-container">
          <div
            ref={innerRef}
            className="aptus-software-mid-band__inner relative text-center"
          >
            <h2 data-cta-animate className="aptus-software-mid-title">
              {heading}
            </h2>
            {description && (
              <p data-cta-animate className="aptus-software-mid-lead">
                {description}
              </p>
            )}
            <div data-cta-animate className="mt-8">
              <Link href={quoteHref} className="aptus-software-btn aptus-software-btn-blue">
                {quoteLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id={data.showForm ? "Form" : undefined}
        className={cn(
        isSoftwareMid ? "aptus-software-mid-band" : isLight ? "aptus-software-section aptus-form-band" : "section-padding",
        isContactPage
          ? "aptus-contact-form-band"
          : isCareer
            ? "aptus-career-form-band"
            : isLight
              ? "aptus-form-band"
              : isSoftwareMid
                ? undefined
                : "bg-white",
      )}
      data-section="cta"
      data-layout={data.layout ?? "dark"}
    >
      {isSoftwareMid ? (
        <div className="aptus-live-container">
          <div
            ref={innerRef}
            className="aptus-software-mid-band__inner relative text-center"
          >
            {data.heading && (
              <h2 data-cta-animate className="aptus-software-mid-title">
                {data.heading}
              </h2>
            )}
            {data.description && (
              <p data-cta-animate className="aptus-software-mid-lead">
                {data.description}
              </p>
            )}
            {data.action && (
              <div data-cta-animate className="mt-8">
                <Link href={data.action.href} className="aptus-software-btn aptus-software-btn-blue">
                  {data.action.label}
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
      <Container
        size={isLight || isCareer || isContactPage ? "md" : "site"}
        className={cn(
          isLight && "max-w-[750px]",
          (isCareer || isContactPage) && "max-w-[800px]",
        )}
      >
        <div
          ref={innerRef}
          className={cn(
            "relative text-center",
            isSoftwareMid && "aptus-software-mid-band__inner",
            isLight && "aptus-form-card",
            !isLight &&
              !isCareer &&
              !isContactPage &&
              !isSoftwareMid &&
              "overflow-hidden rounded-xl bg-brand-navy px-6 py-12 sm:px-12 sm:py-14",
          )}
        >
          {!isLight && !isCareer && !isContactPage && !isSoftwareMid && (
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-green/10"
              aria-hidden="true"
            />
          )}

          {data.heading &&
            (isContactPage ? (
              <h1 data-cta-animate className="aptus-contact-form-title">
                {data.heading}
              </h1>
            ) : (
              <h2
                data-cta-animate
                className={cn(
                  "relative",
                  isCareer
                    ? "aptus-career-form-heading"
                    : isSoftwareMid
                      ? "aptus-software-mid-title"
                    : isSoftwareQuote
                      ? "aptus-software-form-heading"
                    : isLight
                      ? "aptus-cta-light-heading"
                      : "text-white",
                )}
                style={!isCareer && !isSoftwareMid && !isSoftwareQuote && !isLight
                  ? { fontSize: 'var(--text-3xl)', fontWeight: 600 }
                  : undefined}
              >
                {data.heading}
              </h2>
            ))}
          {data.description && (
            <p
              data-cta-animate
              className={cn(
                "relative mx-auto mt-4 max-w-xl text-start",
                isContactPage
                  ? "aptus-contact-form-subtitle"
                  : isSoftwareMid
                    ? "aptus-software-mid-lead"
                  : isSoftwareQuote
                    ? "aptus-software-form-lead"
                  : isLight
                    ? "text-[#695b5b]"
                    : isCareer
                      ? "text-black"
                      : "text-white/75",
              )}
            >
              {data.description}
            </p>
          )}

          {data.showForm ? (
            <CtaForm data={data} />
          ) : (
            data.action && (
              <div data-cta-animate className="relative mt-7">
                <Link
                  href={data.action.href}
                  className={isSoftwareMid ? "aptus-software-btn aptus-software-btn-blue" : "btn-section"}
                >
                  {data.action.label}
                </Link>
              </div>
            )
          )}
        </div>
      </Container>
      )}
    </section>
  );
}
