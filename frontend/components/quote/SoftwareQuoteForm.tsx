"use client";

import { QuoteProductSelect } from "@/components/quote/QuoteProductSelect";
import { QuoteSearchSelect } from "@/components/quote/QuoteSearchSelect";
import { fetchAuthMeShared } from "@/lib/auth-me-client";
import { normalizePhone } from "@/lib/phone";
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
  TAX_ID_MAX_LENGTH,
  alphanumOnly,
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
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FormEvent,
} from "react";

const LEGACY_SESSION_KEY = "aptusPortalSession";

type LegacyPortalSession = {
  userId?: string;
  email?: string;
  name?: string;
  company?: string;
  phone?: string;
  contactType?: string;
  taxId?: string;
  expiresAt?: number;
};

function readLegacyPortalSession(): LegacyPortalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(LEGACY_SESSION_KEY) ||
      window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegacyPortalSession;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}
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

/** Match the longest dial-code prefix, then keep up to 10 local digits. */
function splitProfilePhone(phone: string): { countryCode: string; local: string } {
  const normalized = normalizePhone(phone.trim());
  if (!normalized) {
    return { countryCode: DEFAULT_COUNTRY_CALLING_CODE, local: "" };
  }

  const codes = [...COUNTRY_CALLING_CODES]
    .map((c) => c.value)
    .sort((a, b) => b.length - a.length);

  for (const code of codes) {
    if (normalized.startsWith(code)) {
      return {
        countryCode: code,
        local: digitsOnly(normalized.slice(code.length), PHONE_LOCAL_MAX_DIGITS),
      };
    }
  }

  if (normalized.startsWith("+")) {
    return {
      countryCode: DEFAULT_COUNTRY_CALLING_CODE,
      local: digitsOnly(normalized.replace(/^\+\d{1,4}/, ""), PHONE_LOCAL_MAX_DIGITS),
    };
  }

  return {
    countryCode: DEFAULT_COUNTRY_CALLING_CODE,
    local: digitsOnly(normalized, PHONE_LOCAL_MAX_DIGITS),
  };
}

function profileToQuoteDefaults(user: {
  id?: string;
  contactType?: string;
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
}): {
  customerType: CustomerType;
  name: string;
  email: string;
  company: string;
  countryCode: string;
  phoneLocal: string;
  taxId: string;
  crNumber: string;
  sourceId: string;
} {
  const isCompany = user.contactType === "company";
  const companyName =
    user.company && user.company !== "Customer" ? user.company : user.name;
  // Odoo stores Tax ID on res.partner.vat — portal exposes it as taxId / CR.
  const profileTax = (user.taxId ?? "").trim();
  const taxAlnum = alphanumOnly(profileTax, TAX_ID_MAX_LENGTH);
  const taxDigits = digitsOnly(profileTax, CR_NUMBER_MAX_DIGITS);
  const phone = splitProfilePhone(user.phone || "");

  return {
    customerType: isCompany ? "company" : "individual",
    name: user.name?.trim() || "",
    email: user.email?.trim() || "",
    company: isCompany ? (companyName ?? "").trim() : "",
    countryCode: phone.countryCode,
    phoneLocal: phone.local,
    // Prefill Tax ID from Odoo tax field; also seed CR when the value is numeric.
    taxId: taxAlnum,
    crNumber: /^\d+$/.test(profileTax.replace(/\s/g, ""))
      ? taxDigits
      : taxDigits.length >= 6
        ? taxDigits
        : "",
    sourceId: user.id || user.email || "legacy",
  };
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CALLING_CODE);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [vatId, setVatId] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [profilePrefill, setProfilePrefill] = useState(false);
  const [qty, setQty] = useState("1");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const prefilledUserId = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function applyQuoteDefaults(
    defaults: ReturnType<typeof profileToQuoteDefaults>,
  ) {
    if (prefilledUserId.current === defaults.sourceId) return;
    prefilledUserId.current = defaults.sourceId;
    setCustomerType(defaults.customerType);
    setName(defaults.name);
    setEmail(defaults.email);
    setCompany(defaults.company);
    setCountryCode(defaults.countryCode);
    setPhoneLocal(defaults.phoneLocal);
    setVatId(defaults.taxId);
    setCrNumber(defaults.crNumber);
    setProfilePrefill(true);
  }

  const productOptions = useMemo(() => {
    const list = [...products];
    if (defaultProduct && !list.includes(defaultProduct)) {
      list.unshift(defaultProduct);
    }
    return list;
  }, [products, defaultProduct]);

  const selectDefault = useMemo(() => {
    if (defaultProduct && productOptions.includes(defaultProduct)) {
      return [defaultProduct];
    }
    return [];
  }, [defaultProduct, productOptions]);

  useEffect(() => {
    setSelectedProducts(selectDefault);
  }, [selectDefault.join("|")]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await fetchAuthMeShared();
      if (cancelled) return;

      if (result.ok) {
        applyQuoteDefaults(profileToQuoteDefaults(result.user));
        return;
      }

      // Public product pages may not have a fresh /api/auth/me cookie yet —
      // fall back to the portal session already in localStorage.
      const legacy = readLegacyPortalSession();
      if (!legacy?.email && !legacy?.name) return;
      applyQuoteDefaults(
        profileToQuoteDefaults({
          id: legacy.userId,
          contactType: legacy.contactType,
          company: legacy.company,
          name: legacy.name,
          email: legacy.email,
          phone: legacy.phone,
          taxId: legacy.taxId,
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setErrors({});
    setMessage("");
    setStatus("idle");
    setQuoteRef("");
  }, [customerType]);

  function clearField(nameKey: string) {
    if (!errors[nameKey]) return;
    const next = { ...errors };
    delete next[nameKey];
    setErrors(next);
    if (!Object.keys(next).length) {
      setMessage("");
      if (status === "error") setStatus("idle");
    }
  }

  const inputError = (nameKey: string) =>
    errors[nameKey] ? "aptus-form-input--error" : undefined;

  function onPhoneLocalChange(e: ChangeEvent<HTMLInputElement>) {
    setPhoneLocal(digitsOnly(e.target.value, PHONE_LOCAL_MAX_DIGITS));
    clearField("phone_local");
  }

  function onVatChange(e: ChangeEvent<HTMLInputElement>) {
    setVatId(alphanumOnly(e.target.value, TAX_ID_MAX_LENGTH));
    clearField("tax_id");
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
    const messageValue = String(
      new FormData(form).get("message") ?? "",
    ).trim();
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || name.trim();
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;
    const fullPhone = phoneLocal
      ? `${countryCode}${phoneLocal}`
      : "";

    // Explicit payload — do not rely on FormData key iteration (can drop fields).
    const payload: Record<string, string> = {
      customer_type: customerType,
      category,
      name: name.trim(),
      first_name: firstName,
      last_name: lastName,
      email: email.trim(),
      company:
        customerType === "company" ? company.trim() : "Individual",
      country_code: countryCode,
      phone_local: phoneLocal,
      phone: fullPhone,
      product: selectedProducts.join(", "),
      qty: qty || "1",
      message: messageValue,
      profession: "",
      tax_id: customerType === "company" ? vatId : "",
      vat_id: customerType === "company" ? vatId : "",
      cr_number: customerType === "company" ? crNumber : "",
    };

    if (customerType === "individual") {
      const professionValue = String(
        new FormData(form).get("profession") ?? "",
      ).trim();
      payload.profession = professionValue;
    }

    const fieldErrors = validateQuoteContactFields(payload);
    if (attachmentError) {
      fieldErrors.attachment = attachmentError;
    }
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      setStatus("error");
      const labels = Object.entries(fieldErrors)
        .filter(([k]) => k !== "_form")
        .map(([, msg]) => msg)
        .slice(0, 3);
      setMessage(
        labels.length
          ? labels.join(" ")
          : "Please fill highlighted fields.",
      );
      window.setTimeout(() => {
        form
          .querySelector<HTMLElement>(".aptus-form-input--error, [aria-invalid='true']")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setErrors({});
    setStatus("submitting");
    setMessage("");
    setQuoteRef("");

    try {
      // Same-origin proxy (/api/contact) — avoids cross-origin CORS failures.
      const url = "/api/contact";
      let res: Response;
      if (attachment) {
        const formData = new FormData();
        for (const [key, value] of Object.entries(payload)) {
          formData.set(key, value);
        }
        formData.set("attachment", attachment);
        res = await fetch(url, { method: "POST", body: formData });
      } else {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

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
        if (prefilledUserId.current) {
          const again = await fetchAuthMeShared();
          if (again.ok) {
            const defaults = profileToQuoteDefaults(again.user);
            setCustomerType(defaults.customerType);
            setName(defaults.name);
            setEmail(defaults.email);
            setCompany(defaults.company);
            setCountryCode(defaults.countryCode);
            setPhoneLocal(defaults.phoneLocal);
            setVatId(defaults.taxId);
            setCrNumber(defaults.crNumber);
            setProfilePrefill(true);
          }
        } else {
          setName("");
          setEmail("");
          setCompany("");
          setPhoneLocal("");
          setVatId("");
          setCrNumber("");
          setCountryCode(DEFAULT_COUNTRY_CALLING_CODE);
          setCustomerType("individual");
          setProfilePrefill(false);
        }
        setAttachment(null);
        setQty("1");
        setSelectedProducts(selectDefault);
        return;
      }

      let msg =
        "We couldn't submit your request right now. Please try again or contact our sales team.";
      try {
        const data = await res.json();
        if (data.errors && typeof data.errors === "object") {
          const apiErrors = data.errors as FieldErrors;
          setErrors(apiErrors);
          const msgs = Object.entries(apiErrors)
            .filter(([k]) => k !== "_form")
            .map(([, m]) => m)
            .slice(0, 3);
          msg = msgs.length
            ? msgs.join(" ")
            : (apiErrors._form ?? msg);
          window.setTimeout(() => {
            formRef.current
              ?.querySelector<HTMLElement>(
                ".aptus-form-input--error, [aria-invalid='true']",
              )
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 50);
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
      setMessage(
        "We couldn't reach the quote service. Please try again in a moment, or contact our sales team.",
      );
    }
  }

  return (
    <form
      ref={formRef}
      className={cn("relative mt-8 w-full text-left", className)}
      onSubmit={handleSubmit}
      noValidate
      {...formProps}
    >
      <input type="hidden" name="category" value={category} />

      {profilePrefill && (
        <p className="mb-4 rounded-lg bg-[#1352a3]/0.08 px-3 py-2 text-sm text-[#1352a3]">
          Basic details were filled from your account. You can edit them before submitting.
        </p>
      )}

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
            <input type="hidden" name="email" value={email} />
            <label className="aptus-form-label">
              Company Name *
              <input
                type="text"
                name="company"
                autoComplete="organization"
                required
                value={company}
                aria-invalid={errors.company ? true : undefined}
                onChange={(e) => {
                  setCompany(e.target.value);
                  clearField("company");
                }}
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
                value={name}
                aria-invalid={errors.name ? true : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  clearField("name");
                }}
                className={cn(
                  "aptus-form-input mt-0 w-full px-4 py-3",
                  inputError("name"),
                )}
              />
              <FieldError message={errors.name} />
            </label>
            <label className="aptus-form-label">
              Tax ID *
              <input
                type="text"
                name="tax_id"
                inputMode="text"
                autoComplete="off"
                maxLength={TAX_ID_MAX_LENGTH}
                value={vatId}
                required
                placeholder="Letters and numbers, up to 12"
                aria-invalid={errors.tax_id ? true : undefined}
                onChange={onVatChange}
                className={cn(
                  "aptus-form-input mt-0 w-full px-4 py-3",
                  inputError("tax_id"),
                )}
              />
              <FieldError message={errors.tax_id} />
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
                value={name}
                aria-invalid={errors.name ? true : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  clearField("name");
                }}
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
                value={email}
                placeholder="name@example.com"
                aria-invalid={errors.email ? true : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearField("email");
                }}
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

        <div>
          <QuoteProductSelect
            key={`${category}:${productLabel}:${selectDefault.join("|")}:${productOptions.join("|")}`}
            name="product"
            label={`${productLabel} *`}
            products={productOptions}
            defaultSelected={selectedProducts.length ? selectedProducts : selectDefault}
            placeholder={PRODUCT_PLACEHOLDER}
            error={Boolean(errors.product)}
            onChange={(next) => {
              setSelectedProducts(next);
              clearField("product");
            }}
          />
          <FieldError message={errors.product} />
        </div>

        <label className="aptus-form-label">
          Quantity *
          <input
            type="number"
            name="qty"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="1"
            value={qty}
            required
            aria-invalid={errors.qty ? true : undefined}
            onChange={(e) => {
              setQty(e.target.value);
              clearField("qty");
            }}
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
