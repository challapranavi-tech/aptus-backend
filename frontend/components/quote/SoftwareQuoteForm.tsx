"use client";

import { QuoteProductSelect } from "@/components/quote/QuoteProductSelect";
import { publicApiBase } from "@/lib/api-base";
import { normalizePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { validateQuoteContactFields } from "@shared/lib/contact-request";
import type { FieldErrors } from "@shared/lib/schema";
import { useState, type ComponentPropsWithoutRef, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

type SoftwareQuoteFormProps = {
  submitLabel?: string;
  className?: string;
  /** Routes the lead (software vs ELV inbox). */
  category?: "software" | "elv";
  /** Dropdown label, e.g. "Adobe Product". */
  productLabel?: string;
  /** Family-specific product options. */
  products?: string[];
  /** Prefills the product select when opening from a product page. */
  defaultProduct?: string;
} & Omit<ComponentPropsWithoutRef<"form">, "className" | "action" | "method" | "children" | "onSubmit">;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="mt-1 block text-sm font-medium text-red-600" role="alert">
      {message}
    </span>
  );
}

export function SoftwareQuoteForm({
  submitLabel = "Submit Now",
  className,
  category = "software",
  productLabel = "Product",
  products = [],
  defaultProduct,
  ...formProps
}: SoftwareQuoteFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const selectDefault =
    defaultProduct && products.includes(defaultProduct)
      ? defaultProduct
      : "Select Product";

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
    if (status === "submitting") return;

    // Capture before await — React nulls e.currentTarget after the handler yields.
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    if (typeof payload.phone === "string") {
      payload.phone = normalizePhone(payload.phone);
    }

    const fieldErrors = validateQuoteContactFields(payload);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      setStatus("error");
      setMessage("Please fill highlighted fields.");
      return;
    }

    setErrors({});
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(`${publicApiBase()}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("success");
        setMessage(
          "Thank you! Your quote request has been submitted. Our team will contact you shortly.",
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
    }
  }

  return (
    <form
      className={cn("relative mt-8 w-full text-left", className)}
      onSubmit={handleSubmit}
      noValidate
      {...formProps}
    >
      <input type="hidden" name="category" value={category} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="aptus-form-label">
          First Name *
          <input
            type="text"
            name="first_name"
            autoComplete="given-name"
            required
            aria-invalid={errors.first_name ? true : undefined}
            onChange={() => clearField("first_name")}
            className={cn("aptus-form-input mt-0 w-full px-4 py-3", inputError("first_name"))}
          />
          <FieldError message={errors.first_name} />
        </label>
        <label className="aptus-form-label">
          Last Name *
          <input
            type="text"
            name="last_name"
            autoComplete="family-name"
            required
            aria-invalid={errors.last_name ? true : undefined}
            onChange={() => clearField("last_name")}
            className={cn("aptus-form-input mt-0 w-full px-4 py-3", inputError("last_name"))}
          />
          <FieldError message={errors.last_name} />
        </label>
        <label className="aptus-form-label">
          Email *
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Official Email"
            required
            aria-invalid={errors.email ? true : undefined}
            onChange={() => clearField("email")}
            className={cn("aptus-form-input mt-0 w-full px-4 py-3", inputError("email"))}
          />
          <FieldError message={errors.email} />
        </label>
        <label className="aptus-form-label">
          Company *
          <input
            type="text"
            name="company"
            autoComplete="organization"
            placeholder="Company Name"
            required
            aria-invalid={errors.company ? true : undefined}
            onChange={() => clearField("company")}
            className={cn("aptus-form-input mt-0 w-full px-4 py-3", inputError("company"))}
          />
          <FieldError message={errors.company} />
        </label>
        <QuoteProductSelect
          key={`${category}:${productLabel}:${selectDefault}:${products.join("|")}`}
          label={productLabel}
          products={products}
          defaultValue={selectDefault}
        />
        <label className="aptus-form-label">
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
            className={cn("aptus-form-input mt-0 w-full px-4 py-3", inputError("qty"))}
          />
          <FieldError message={errors.qty} />
        </label>
        <label className="aptus-form-label">
          Phone *
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="e.g.+ 968 0000 0000"
            required
            aria-invalid={errors.phone ? true : undefined}
            onChange={() => clearField("phone")}
            className={cn("aptus-form-input mt-0 w-full px-4 py-3", inputError("phone"))}
          />
          <FieldError message={errors.phone} />
        </label>
      </div>
      <label className="aptus-form-label mt-5 block">
        Message
        <textarea name="message" rows={4} placeholder="Message" className="aptus-form-input mt-0 w-full px-4 py-3" />
      </label>

      {status === "success" && (
        <p className="mt-5 rounded-xl bg-green-600/10 px-4 py-3 text-center text-base font-semibold text-green-800" role="status">
          {message}
        </p>
      )}
      {status === "error" && message && (
        <p className="mt-5 rounded-xl bg-red-600/10 px-4 py-3 text-center text-base font-semibold text-red-700" role="alert">
          {message}
        </p>
      )}

      <div className="mt-5 text-center">
        <button type="submit" className="aptus-form-submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
