"use client";

import { SoftwareQuoteForm } from "@/components/quote/SoftwareQuoteForm";
import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { CTA as CTAData } from "@/types";
import Link from "next/link";
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

function HeardFromSelect({
  required = true,
  className,
  variant = "default",
}: {
  required?: boolean;
  className: string;
  variant?: "default" | "career";
}) {
  if (variant === "career") {
    return (
      <select name="heard_from" required={required} className={className} defaultValue="Media">
        <option value="Media">Media</option>
        <option value="Referals">Referals</option>
        <option value="Social Media">Social Media</option>
        <option value="Events">Events</option>
      </select>
    );
  }

  return (
    <select name="heard_from" required={required} className={className} defaultValue="">
      <option value="" disabled>
        Select an option
      </option>
      <option value="Search Engine">Search Engine</option>
      <option value="Social Media">Social Media</option>
      <option value="Referrals">Referrals</option>
      <option value="Events">Events</option>
      <option value="LinkedIn">LinkedIn</option>
      <option value="Media">Media</option>
      <option value="Other">Other</option>
    </select>
  );
}

function CtaForm({ data }: { data: CTAData }) {
  const variant = data.formVariant ?? "simple";
  const fc = formClasses(data.layout);

  if (variant === "career") {
    return (
      <form data-cta-animate className="relative mt-8 w-full text-left" action="#" method="post">
        <div className="grid gap-[30px] sm:grid-cols-2">
          <label className={fc.label}>
            First Name
            <input type="text" name="first_name" placeholder="First Name" required className={fc.input} />
          </label>
          <label className={fc.label}>
            Last Name
            <input type="text" name="last_name" placeholder="Last Name" required className={fc.input} />
          </label>
          <label className={`${fc.label} sm:col-span-2`}>
            Job Title
            <input
              type="text"
              name="job_title"
              placeholder="For Which position are you applying?"
              required
              className={fc.input}
            />
          </label>
          <label className={fc.label}>
            City
            <input type="text" name="city" placeholder="City" required className={fc.input} />
          </label>
          <label className={fc.label}>
            State/Province
            <input type="text" name="state" placeholder="State/Province" required className={fc.input} />
          </label>
          <label className={fc.label}>
            Email Address
            <input type="email" name="email" placeholder="Email Address" required className={fc.input} />
          </label>
          <label className={fc.label}>
            Country
            <input type="text" name="country" placeholder="Country" required className={fc.input} />
          </label>
          <label className={fc.label}>
            Phone Number
            <input type="tel" name="phone" placeholder="Phone Number" required className={fc.input} />
          </label>
          <label className={`${fc.label} sm:col-span-2`}>
            Linkedin
            <input type="url" name="linkedin" placeholder="Profile link" required className={fc.input} />
          </label>
          <label className={fc.label}>
            How did you hear about us?
            <HeardFromSelect variant="career" className={fc.input} />
          </label>
          <label className={`${fc.label} sm:col-span-2`}>
            Upload Your CV
            <input type="file" name="cv" accept=".pdf,.doc,.docx" className={`${fc.input} py-2`} />
          </label>
        </div>
        <div className="mt-8 text-center">
          <button type="submit" className={fc.submit}>
            {data.submitLabel ?? "Submit Application"}
          </button>
        </div>
      </form>
    );
  }

  if (variant === "software-quote") {
    return (
      <SoftwareQuoteForm
        data-cta-animate
        submitLabel={data.submitLabel ?? "Submit Now"}
      />
    );
  }

  if (variant === "contact") {
    const isContactPage = data.layout === "contact-page";

    if (isContactPage) {
      return (
        <form data-cta-animate className="relative mt-8 w-full text-left" action="#" method="post">
          <div className="grid gap-[30px] sm:grid-cols-2">
            <label className={fc.label}>
              First Name
              <input type="text" name="first_name" placeholder="First Name" required className={fc.input} />
            </label>
            <label className={fc.label}>
              Last Name
              <input type="text" name="last_name" placeholder="Last Name" required className={fc.input} />
            </label>
            <label className={fc.label}>
              City
              <input type="text" name="city" placeholder="City" required className={fc.input} />
            </label>
            <label className={fc.label}>
              Country
              <input type="text" name="country" placeholder="STATE/PROVINCE" required className={fc.input} />
            </label>
            <label className={fc.label}>
              Email Address
              <input type="email" name="email" placeholder="EMAIL ADDRESS" required className={fc.input} />
            </label>
            <label className={fc.label}>
              Phone Number
              <input type="tel" name="phone" placeholder="Phone Number" required className={fc.input} />
            </label>
            <label className={`${fc.label} sm:col-span-2`}>
              How can we help you?
              <textarea
                name="message"
                rows={4}
                placeholder="Your Query"
                required
                className={fc.input}
              />
            </label>
            <label className={fc.label}>
              How did you hear about us?
              <HeardFromSelect variant="career" className={fc.input} />
            </label>
          </div>
          <div className="mt-8 text-center">
            <button type="submit" className={fc.submit}>
              {data.submitLabel ?? "Submit Now"}
            </button>
          </div>
        </form>
      );
    }

    return (
      <form data-cta-animate className="relative mx-auto mt-8 max-w-2xl text-left" action="#" method="post">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={fc.label}>
            First Name *
            <input type="text" name="first_name" required className={fc.input} />
          </label>
          <label className={fc.label}>
            Last Name *
            <input type="text" name="last_name" required className={fc.input} />
          </label>
          <label className={fc.label}>
            City *
            <input type="text" name="city" required className={fc.input} />
          </label>
          <label className={fc.label}>
            State/Province *
            <input type="text" name="state" required className={fc.input} />
          </label>
          <label className={fc.label}>
            Email *
            <input type="email" name="email" required className={fc.input} />
          </label>
          <label className={fc.label}>
            Phone *
            <input type="tel" name="phone" required className={fc.input} />
          </label>
        </div>
        <label className={`mt-4 ${fc.label}`}>
          How can we help you? *
          <textarea name="message" rows={4} required className={fc.input} />
        </label>
        <label className={`mt-4 ${fc.label}`}>
          How did you hear about us? *
          <HeardFromSelect className={fc.input} />
        </label>
        <div className="mt-6 text-center">
          <button type="submit" className={fc.submit}>
            {data.submitLabel ?? "Send Message"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form data-cta-animate className="relative mt-8 w-full text-left" action="/contact-us" method="get">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={fc.label}>
          First Name *
          <input type="text" name="first_name" required className={fc.input} />
        </label>
        <label className={fc.label}>
          Last Name *
          <input type="text" name="last_name" required className={fc.input} />
        </label>
        <label className={fc.label}>
          Email *
          <input type="email" name="email" placeholder="name@mail.com" required className={fc.input} />
        </label>
        <label className={fc.label}>
          Phone *
          <input type="tel" name="phone" placeholder="e.g,+ 968 0000 0000" required className={fc.input} />
        </label>
      </div>
      <label className={`mt-5 block ${fc.label}`}>
        Message
        <textarea name="message" rows={4} placeholder="Message" className={fc.input} />
      </label>
      <div className="mt-5">
        <button type="submit" className={fc.submit}>
          {data.submitLabel ?? "Submit Now"}
        </button>
      </div>
    </form>
  );
}

export function CTA({ data }: CTAProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isLight = data.layout === "light";

  if (isLight) return null;

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
                "relative mx-auto mt-4 max-w-xl",
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
