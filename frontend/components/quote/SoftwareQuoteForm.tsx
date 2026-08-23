"use client";

import { QuoteProductSelect } from "@/components/quote/QuoteProductSelect";
import { QuoteSearchSelect } from "@/components/quote/QuoteSearchSelect";
import { publicApiBase } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import {
  COUNTRY_CALLING_CODES,
  DEFAULT_COUNTRY_CALLING_CODE,
  digitsOnly,
} from "@shared/lib/country-calling-codes";
import {
  CR_NUMBER_MAX_DIGITS,
  MAX_QUOTE_ATTACHMENT_BYTES,
  PHONE_LOCAL_MAX_DIGITS,
  PRODUCT_PLACEHOLDER,
  QUOTE_ATTACHMENT_ACCEPT,
  VAT_ID_MAX_DIGITS,
  quoteAttachmentExtensionOk,
  validateQuoteContactFields,
  type CustomerType,
} from "@shared/lib/contact-request";
import {
  PROFESSION_PLACEHOLDER,
  QUOTE_PROFESSIONS,
} from "@shared/lib/quote-professions";
import type { FieldErrors } from "@shared/lib/schema";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FormEvent,
} from "react";

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
} & Omit<
  ComponentPropsWithoutRef<"form">,
  "className" | "action" | "method" | "children" | "onSubmit"
>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="mt-1 block text-sm font-medium text-red-600" role="alert">
      {message}
    </span>
  );
}

function humanSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function SoftwareQuoteForm({
  submitLabel = "Submit Request",
  className,
  category = "software",
  productLabel = "Software Product",
  products = [],
  defaultProduct,
  ...formProps
}: SoftwareQuoteFormProps) {
  const [customerType, setCustomerType] = useState<CustomerType>("individual");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [quoteRef, setQuoteRef] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CALLING_CODE);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [vatId, setVatId] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");

  const selectDefault =
    defaultProduct && products.includes(defaultProduct)
      ? defaultProduct
      : PRODUCT_PLACEHOLDER;

  useEffect(() => {
    setErrors({});
    setMessage("");
    setStatus("idle");
    setQuoteRef("");
  }, [customerType]);

  function clearField(name: string) {
    if (!errors[name]) return;
    const next = { ...errors };
    delete next[name];
    setErrors(next);
    if (!Object.keys(next).length) {
      setMessage("");
      if (status === "error") setStatus("idle");
    }
  }

  const inputError = (name: string) =>
    errors[name] ? "aptus-form-input--error" : undefined;

  function onPhoneLocalChange(e: ChangeEvent<HTMLInputElement>) {
    setPhoneLocal(digitsOnly(e.target.value, PHONE_LOCAL_MAX_DIGITS));
    clearField("phone_local");
  }

  function onVatChange(e: ChangeEvent<HTMLInputElement>) {
    setVatId(digitsOnly(e.target.value, VAT_ID_MAX_DIGITS));
    clearField("vat_id");
  }

  function onCrChange(e: ChangeEvent<HTMLInputElement>) {
    setCrNumber(digitsOnly(e.target.value, CR_NUMBER_MAX_DIGITS));
    clearField("cr_number");
  }

  function onAttachmentChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAttachmentError("");
    if (!file) {
      setAttachment(null);
      return;
    }
    if (!quoteAttachmentExtensionOk(file.name)) {
      setAttachment(null);
      setAttachmentError(
        "Unsupported file type. Use PDF, Word, Excel, image, or ZIP.",
      );
      e.target.value = "";
      return;
    }
    if (file.size > MAX_QUOTE_ATTACHMENT_BYTES) {
      setAttachment(null);
      setAttachmentError(
        `Attachment must be ${humanSize(MAX_QUOTE_ATTACHMENT_BYTES)} or smaller.`,
      );
      e.target.value = "";
      return;
    }
    setAttachment(file);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("customer_type", customerType);
    formData.set("country_code", countryCode);
    formData.set("phone_local", phoneLocal);
    if (customerType === "company") {
      formData.set("vat_id", vatId);
      formData.set("cr_number", crNumber);
    }
    if (attachment) {
      formData.set("attachment", attachment);
    } else {
      formData.delete("attachment");
    }

    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") payload[key] = value;
    });

    const fieldErrors = validateQuoteContactFields(payload);
    if (attachmentError) {
      fieldErrors.attachment = attachmentError;
    }
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      setStatus("error");
      setMessage("Please fill highlighted fields.");
      return;
    }

    setErrors({});
    setStatus("submitting");
    setMessage("");
    setQuoteRef("");

    try {
      const res = await fetch(`${publicApiBase()}/api/contact`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        let ref = "";
        try {
          const data = (await res.json()) as { quoteRef?: string };
          ref = data.quoteRef?.trim() ?? "";
        } catch {
          /* ignore */
        }
        setQuoteRef(ref);
        setStatus("success");
        setMessage(
          ref
            ? `Your Request Quote has been submitted successfully.\nReference Number: ${ref}`
            : "Request Submitted Successfully. Thank you for your request. Our sales team will review your requirements and contact you shortly.",
        );
        form.reset();
        setPhoneLocal("");
        setVatId("");
        setCrNumber("");
        setAttachment(null);
        setCountryCode(DEFAULT_COUNTRY_CALLING_CODE);
        setCustomerType("individual");
        return;
      }

      let msg =
        "We couldn't submit your request right now. Please try again or contact our sales team.";
      try {
        const data = await res.json();
        if (data.errors && typeof data.errors === "object") {
          const apiErrors = data.errors as FieldErrors;
          setErrors(apiErrors);
          const fieldKeys = Object.keys(apiErrors).filter((k) => k !== "_form");
          msg = fieldKeys.length
            ? "Please fill highlighted fields."
            : (apiErrors._form ?? msg);
        } else if (typeof data.error === "string" && data.error) {
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

      <fieldset className="aptus-quote-customer-type">
        <legend className="aptus-form-label mb-2">Customer Type</legend>
        <div
          className="aptus-quote-customer-type__toggle"
          role="tablist"
          aria-label="Customer type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={customerType === "individual"}
            className={cn(
              "aptus-quote-customer-type__btn",
              customerType === "individual" &&
                "aptus-quote-customer-type__btn--active",
            )}
            onClick={() => setCustomerType("individual")}
          >
            Individual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={customerType === "company"}
            className={cn(
              "aptus-quote-customer-type__btn",
              customerType === "company" &&
                "aptus-quote-customer-type__btn--active",
            )}
            onClick={() => setCustomerType("company")}
          >
            Company
          </button>
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {customerType === "company" ? (
          <>
            <label className="aptus-form-label">
              Company Name *
              <input
                type="text"
                name="company"
                autoComplete="organization"
                required
                aria-invalid={errors.company ? true : undefined}
                onChange={() => clearField("company")}
                className={cn(
                  "aptus-form-input mt-0 w-full px-4 py-3",
                  inputError("company"),
                )}
              />
              <FieldError message={errors.company} />
            </label>
            <label className="aptus-form-label">
              Name *
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                aria-invalid={errors.name ? true : undefined}
                onChange={() => clearField("name")}
                className={cn(
                  "aptus-form-input mt-0 w-full px-4 py-3",
                  inputError("name"),
                )}
              />
              <FieldError message={errors.name} />
            </label>
            <label className="aptus-form-label">
              VAT ID *
              <input
                type="text"
                name="vat_id"
                inputMode="numeric"
                autoComplete="off"
                maxLength={VAT_ID_MAX_DIGITS}
                value={vatId}
                required
                placeholder="Up to 12 digits"
                aria-invalid={errors.vat_id ? true : undefined}
                onChange={onVatChange}
                className={cn(
                  "aptus-form-input mt-0 w-full px-4 py-3",
                  inputError("vat_id"),
                )}
              />
              <FieldError message={errors.vat_id} />
            </label>
            <label className="aptus-form-label">
              CR Number *
              <input
                type="text"
                name="cr_number"
                inputMode="numeric"
                autoComplete="off"
                maxLength={CR_NUMBER_MAX_DIGITS}
                value={crNumber}
                required
                placeholder="Up to 10 digits"
                aria-invalid={errors.cr_number ? true : undefined}
                onChange={onCrChange}
                className={cn(
                  "aptus-form-input mt-0 w-full px-4 py-3",
                  inputError("cr_number"),
                )}
              />
              <FieldError message={errors.cr_number} />
            </label>
          </>
        ) : (
          <>
            <label className="aptus-form-label">
              Name *
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                aria-invalid={errors.name ? true : undefined}
                onChange={() => clearField("name")}
                className={cn(
                  "aptus-form-input mt-0 w-full px-4 py-3",
                  inputError("name"),
                )}
              />
              <FieldError message={errors.name} />
            </label>
            <label className="aptus-form-label">
              Phone Number *
              <span className="mt-0 flex gap-2">
                <select
                  name="country_code"
                  value={countryCode}
                  aria-label="Country calling code"
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    clearField("country_code");
                  }}
                  className={cn(
                    "aptus-form-input w-[9.5rem] shrink-0 px-2 py-3",
                    inputError("country_code"),
                  )}
                >
                  {COUNTRY_CALLING_CODES.map((c) => (
                    <option key={`${c.iso ?? c.label}-${c.value}`} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone_local"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={PHONE_LOCAL_MAX_DIGITS}
                  value={phoneLocal}
                  required
                  placeholder="Phone number"
                  aria-invalid={errors.phone_local ? true : undefined}
                  onChange={onPhoneLocalChange}
                  className={cn(
                    "aptus-form-input min-w-0 flex-1 px-4 py-3",
                    inputError("phone_local"),
                  )}
                />
              </span>
              <FieldError message={errors.phone_local || errors.country_code} />
            </label>
            <label className="aptus-form-label">
              Email ID *
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                aria-invalid={errors.email ? true : undefined}
                onChange={() => clearField("email")}
                className={cn(
                  "aptus-form-input mt-0 w-full px-4 py-3",
                  inputError("email"),
                )}
              />
              <FieldError message={errors.email} />
            </label>
            <div>
              <QuoteSearchSelect
                name="profession"
                label="Profession *"
                options={QUOTE_PROFESSIONS}
                placeholder={PROFESSION_PLACEHOLDER}
                searchPlaceholder="Search profession…"
                error={Boolean(errors.profession)}
                onValueChange={() => clearField("profession")}
              />
              <FieldError message={errors.profession} />
            </div>
          </>
        )}

        {customerType === "company" && (
          <label className="aptus-form-label">
            Phone Number *
            <span className="mt-0 flex gap-2">
              <select
                name="country_code"
                value={countryCode}
                aria-label="Country calling code"
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  clearField("country_code");
                }}
                className={cn(
                  "aptus-form-input w-[9.5rem] shrink-0 px-2 py-3",
                  inputError("country_code"),
                )}
              >
                {COUNTRY_CALLING_CODES.map((c) => (
                  <option key={`${c.iso ?? c.label}-${c.value}`} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="phone_local"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={PHONE_LOCAL_MAX_DIGITS}
                value={phoneLocal}
                required
                placeholder="Phone number"
                aria-invalid={errors.phone_local ? true : undefined}
                onChange={onPhoneLocalChange}
                className={cn(
                  "aptus-form-input min-w-0 flex-1 px-4 py-3",
                  inputError("phone_local"),
                )}
              />
            </span>
            <FieldError message={errors.phone_local || errors.country_code} />
          </label>
        )}

        <QuoteProductSelect
          key={`${category}:${productLabel}:${selectDefault}:${products.join("|")}:${customerType}`}
          name="product"
          label={`${productLabel} *`}
          products={products}
          defaultValue={selectDefault}
          placeholder={PRODUCT_PLACEHOLDER}
        />

        <label className="aptus-form-label">
          Quantity *
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
            className={cn(
              "aptus-form-input mt-0 w-full px-4 py-3",
              inputError("qty"),
            )}
          />
          <FieldError message={errors.qty} />
        </label>

        <label className="aptus-form-label sm:col-span-1">
          Attachment
          <span className="mt-1 block text-xs font-normal text-black/55">
            Optional — bulk-order documents, specs, or purchase requirements
          </span>
          <input
            type="file"
            name="attachment"
            accept={QUOTE_ATTACHMENT_ACCEPT}
            onChange={onAttachmentChange}
            className={cn(
              "aptus-form-input mt-1 w-full px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand-navy/10 file:px-3 file:py-1.5 file:text-sm file:font-medium",
              (errors.attachment || attachmentError) && "aptus-form-input--error",
            )}
          />
          {attachment && (
            <span className="mt-1 block text-sm text-black/70">
              Selected: {attachment.name} ({humanSize(attachment.size)})
            </span>
          )}
          <FieldError message={errors.attachment || attachmentError} />
        </label>
      </div>

      <label className="aptus-form-label mt-5 block">
        Comments
        <textarea
          name="message"
          rows={4}
          placeholder="Additional requirements or questions"
          className="aptus-form-input mt-0 w-full px-4 py-3"
        />
      </label>

      {status === "success" && (
        <p
          className="mt-5 whitespace-pre-line rounded-xl bg-green-600/10 px-4 py-3 text-center text-base font-semibold text-green-800"
          role="status"
        >
          {message}
          {quoteRef ? null : null}
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

      <div className="mt-5 text-center">
        <button
          type="submit"
          className="aptus-form-submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Submitting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
