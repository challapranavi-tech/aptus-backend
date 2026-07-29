"use client";

import { publicApiBase } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import { validateQuoteContactFields } from "@shared/lib/contact-request";
import { validateEnquiryFields } from "@shared/lib/enquiry-request";
import type { FieldErrors } from "@shared/lib/schema";
import { useRef, useState, type FormEvent } from "react";
import { HeardFromSelect } from "./HeardFromSelect";

type Status = "idle" | "submitting" | "success" | "error";

export type ContactLeadVariant = "contact-page" | "contact" | "simple";

const QUOTE_SUCCESS =
  "Thank you! Your quote request has been submitted. Our team will contact you shortly.";

const ENQUIRY_SUCCESS =
  "Thank you for contacting Aptus Infotech. Your enquiry has been submitted successfully. Our team will get back to you shortly.";

type ContactLeadFormProps = {
  variant: ContactLeadVariant;
  submitLabel?: string;
  labelClassName: string;
  inputClassName: string;
  submitClassName: string;
  className?: string;
  /** Quote routing hint → hidden category field. */
  category?: "software" | "elv";
  /** Prefills hidden product on simple quote CTAs. */
  productName?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="mt-1 block text-sm font-medium text-red-600" role="alert">
      {message}
    </span>
  );
}

/**
 * Contact Us → POST /api/enquiry (enquiry email).
 * Product / quote CTAs → POST /api/contact (quote email). Keep workflows separate.
 */
export function ContactLeadForm({
  variant,
  submitLabel = "Submit Now",
  labelClassName,
  inputClassName,
  submitClassName,
  className,
  category,
  productName,
}: ContactLeadFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const submittingRef = useRef(false);
  const isEnquiryForm = variant === "contact-page" || variant === "contact";
  const isQuoteContext = Boolean(category || productName);

  function clearField(name: string) {
    if (!errors[name]) return;
    const next = { ...errors };
    delete next[name];
    setErrors(next);
    if (!Object.keys(next).length) {
      setMessage("");
      setStatus("idle");
    }
  }

  const inputError = (name: string) =>
    errors[name] ? "aptus-form-input--error" : undefined;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;

    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    if (variant === "simple") {
      const fieldErrors = validateQuoteContactFields(payload);
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        setStatus("error");
        setMessage("Please fill highlighted fields.");
        return;
      }
    }

    if (isEnquiryForm) {
      const fieldErrors = validateEnquiryFields(payload);
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        setStatus("error");
        setMessage("Please fill highlighted fields.");
        return;
      }
    }

    submittingRef.current = true;
    setErrors({});
    setStatus("submitting");
    setMessage("");

    try {
      const endpoint = isEnquiryForm ? "/api/enquiry" : "/api/contact";
      const res = await fetch(`${publicApiBase()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("success");
        setMessage(
          isEnquiryForm
            ? ENQUIRY_SUCCESS
            : isQuoteContext
              ? QUOTE_SUCCESS
              : "Thank you! Your message has been sent.",
        );
        form.reset();
        return;
      }

      let msg = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        if (data.errors && typeof data.errors === "object") {
          const apiErrors = data.errors as FieldErrors;
          setErrors(apiErrors);
          const fieldKeys = Object.keys(apiErrors).filter((k) => k !== "_form");
          msg = fieldKeys.length
            ? "Please fill highlighted fields."
            : (apiErrors._form ?? msg);
        } else if (data.error) {
          msg = data.error;
        }
      } catch {
        /* keep default */
      }
      setStatus("error");
      setMessage(msg);
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      submittingRef.current = false;
    }
  }

  const feedback = (
    <>
      {status === "success" && (
        <p
          className="mt-5 rounded-xl bg-green-600/10 px-4 py-3 text-center text-base font-semibold text-green-800"
          role="status"
        >
          {message}
        </p>
      )}
      {status === "error" && message && (
        <p
          className="mt-5 rounded-xl bg-red-600/10 px-4 py-3 text-center text-base font-semibold text-red-700"
          role="alert"
        >
          {message}
        </p>
      )}
    </>
  );

  const submitBtn = (
    <button
      type="submit"
      className={submitClassName}
      disabled={status === "submitting"}
    >
      {status === "submitting" ? "Submitting…" : submitLabel}
    </button>
  );

  if (variant === "contact-page") {
    return (
      <form
        data-cta-animate
        className={cn("relative mt-8 w-full text-left", className)}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid gap-[20px] sm:grid-cols-2 sm:gap-[30px]">
          <label className={labelClassName}>
            First Name
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              required
              aria-invalid={errors.first_name ? true : undefined}
              onChange={() => clearField("first_name")}
              className={cn(inputClassName, inputError("first_name"))}
            />
            <FieldError message={errors.first_name} />
          </label>
          <label className={labelClassName}>
            Last Name
            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              required
              aria-invalid={errors.last_name ? true : undefined}
              onChange={() => clearField("last_name")}
              className={cn(inputClassName, inputError("last_name"))}
            />
            <FieldError message={errors.last_name} />
          </label>
          <label className={labelClassName}>
            City
            <input
              type="text"
              name="city"
              placeholder="City"
              required
              aria-invalid={errors.city ? true : undefined}
              onChange={() => clearField("city")}
              className={cn(inputClassName, inputError("city"))}
            />
            <FieldError message={errors.city} />
          </label>
          <label className={labelClassName}>
            Country
            <input
              type="text"
              name="country"
              placeholder="STATE/PROVINCE"
              required
              aria-invalid={errors.country ? true : undefined}
              onChange={() => clearField("country")}
              className={cn(inputClassName, inputError("country"))}
            />
            <FieldError message={errors.country} />
          </label>
          <label className={labelClassName}>
            Email Address
            <input
              type="email"
              name="email"
              placeholder="EMAIL ADDRESS"
              required
              aria-invalid={errors.email ? true : undefined}
              onChange={() => clearField("email")}
              className={cn(inputClassName, inputError("email"))}
            />
            <FieldError message={errors.email} />
          </label>
          <label className={labelClassName}>
            Phone Number
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              required
              aria-invalid={errors.phone ? true : undefined}
              onChange={() => clearField("phone")}
              className={cn(inputClassName, inputError("phone"))}
            />
            <FieldError message={errors.phone} />
          </label>
          <label className={`${labelClassName} sm:col-span-2`}>
            How can we help you?
            <textarea
              name="message"
              rows={4}
              placeholder="Your Query"
              required
              aria-invalid={errors.message ? true : undefined}
              onChange={() => clearField("message")}
              className={cn(inputClassName, inputError("message"))}
            />
            <FieldError message={errors.message} />
          </label>
          <label className={labelClassName}>
            How did you hear about us?
            <HeardFromSelect
              variant="career"
              className={cn(inputClassName, inputError("heard_from"))}
              aria-invalid={errors.heard_from ? true : undefined}
              onChange={() => clearField("heard_from")}
            />
            <FieldError message={errors.heard_from} />
          </label>
        </div>
        {feedback}
        <div className="mt-8 text-start">{submitBtn}</div>
      </form>
    );
  }

  if (variant === "contact") {
    return (
      <form
        data-cta-animate
        className={cn("relative mx-auto mt-8 max-w-2xl text-left", className)}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClassName}>
            First Name *
            <input
              type="text"
              name="first_name"
              required
              aria-invalid={errors.first_name ? true : undefined}
              onChange={() => clearField("first_name")}
              className={cn(inputClassName, inputError("first_name"))}
            />
            <FieldError message={errors.first_name} />
          </label>
          <label className={labelClassName}>
            Last Name *
            <input
              type="text"
              name="last_name"
              required
              aria-invalid={errors.last_name ? true : undefined}
              onChange={() => clearField("last_name")}
              className={cn(inputClassName, inputError("last_name"))}
            />
            <FieldError message={errors.last_name} />
          </label>
          <label className={labelClassName}>
            City *
            <input
              type="text"
              name="city"
              required
              aria-invalid={errors.city ? true : undefined}
              onChange={() => clearField("city")}
              className={cn(inputClassName, inputError("city"))}
            />
            <FieldError message={errors.city} />
          </label>
          <label className={labelClassName}>
            State/Province *
            <input
              type="text"
              name="state"
              required
              aria-invalid={errors.state || errors.country ? true : undefined}
              onChange={() => {
                clearField("state");
                clearField("country");
              }}
              className={cn(
                inputClassName,
                inputError("state") || inputError("country"),
              )}
            />
            <FieldError message={errors.state || errors.country} />
          </label>
          <label className={labelClassName}>
            Email *
            <input
              type="email"
              name="email"
              required
              aria-invalid={errors.email ? true : undefined}
              onChange={() => clearField("email")}
              className={cn(inputClassName, inputError("email"))}
            />
            <FieldError message={errors.email} />
          </label>
          <label className={labelClassName}>
            Phone *
            <input
              type="tel"
              name="phone"
              required
              aria-invalid={errors.phone ? true : undefined}
              onChange={() => clearField("phone")}
              className={cn(inputClassName, inputError("phone"))}
            />
            <FieldError message={errors.phone} />
          </label>
        </div>
        <label className={`mt-4 ${labelClassName}`}>
          How can we help you? *
          <textarea
            name="message"
            rows={4}
            required
            aria-invalid={errors.message ? true : undefined}
            onChange={() => clearField("message")}
            className={cn(inputClassName, inputError("message"))}
          />
          <FieldError message={errors.message} />
        </label>
        <label className={`mt-4 ${labelClassName}`}>
          How did you hear about us? *
          <HeardFromSelect
            className={cn(inputClassName, inputError("heard_from"))}
            aria-invalid={errors.heard_from ? true : undefined}
            onChange={() => clearField("heard_from")}
          />
          <FieldError message={errors.heard_from} />
        </label>
        {feedback}
        <div className="mt-6 text-start">{submitBtn}</div>
      </form>
    );
  }

  // simple — product-page lead capture
  return (
    <form
      data-cta-animate
      className={cn("relative mt-8 w-full text-left", className)}
      onSubmit={handleSubmit}
      noValidate
    >
      {category ? <input type="hidden" name="category" value={category} /> : null}
      {productName ? <input type="hidden" name="product" value={productName} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>
          First Name *
          <input
            type="text"
            name="first_name"
            autoComplete="given-name"
            required
            aria-invalid={errors.first_name ? true : undefined}
            onChange={() => clearField("first_name")}
            className={cn(inputClassName, inputError("first_name"))}
          />
          <FieldError message={errors.first_name} />
        </label>
        <label className={labelClassName}>
          Last Name *
          <input
            type="text"
            name="last_name"
            autoComplete="family-name"
            required
            aria-invalid={errors.last_name ? true : undefined}
            onChange={() => clearField("last_name")}
            className={cn(inputClassName, inputError("last_name"))}
          />
          <FieldError message={errors.last_name} />
        </label>
        <label className={labelClassName}>
          Email *
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@mail.com"
            required
            aria-invalid={errors.email ? true : undefined}
            onChange={() => clearField("email")}
            className={cn(inputClassName, inputError("email"))}
          />
          <FieldError message={errors.email} />
        </label>
        <label className={labelClassName}>
          Phone *
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="e.g,+ 968 0000 0000"
            required
            aria-invalid={errors.phone ? true : undefined}
            onChange={() => clearField("phone")}
            className={cn(inputClassName, inputError("phone"))}
          />
          <FieldError message={errors.phone} />
        </label>
        <label className={labelClassName}>
          QTY *
          <input
            type="number"
            name="qty"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="1"
            defaultValue={1}
            required
            aria-invalid={errors.qty ? true : undefined}
            onChange={() => clearField("qty")}
            className={cn(inputClassName, inputError("qty"))}
          />
          <FieldError message={errors.qty} />
        </label>
        <label className={labelClassName}>
          Company *
          <input
            type="text"
            name="company"
            autoComplete="organization"
            placeholder="Company Name"
            required
            aria-invalid={errors.company ? true : undefined}
            onChange={() => clearField("company")}
            className={cn(inputClassName, inputError("company"))}
          />
          <FieldError message={errors.company} />
        </label>
      </div>
      <label className={`mt-5 block ${labelClassName}`}>
        Message
        <textarea
          name="message"
          rows={4}
          placeholder="Message"
          className={inputClassName}
        />
      </label>
      {feedback}
      <div className="mt-5">{submitBtn}</div>
    </form>
  );
}
