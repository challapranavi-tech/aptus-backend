"use client";

import { useLocale } from "@/context/LocaleProvider";
import { copyForLocale } from "@/locales/shared-ar";

type HeardFromSelectProps = {
  required?: boolean;
  className: string;
  variant?: "default" | "career";
  "aria-invalid"?: boolean;
  onChange?: () => void;
};

export function HeardFromSelect({
  required = true,
  className,
  variant = "default",
  "aria-invalid": ariaInvalid,
  onChange,
}: HeardFromSelectProps) {
  const { locale } = useLocale();
  const tx = (value: string) => copyForLocale(locale, value);
  if (variant === "career") {
    return (
      <select
        name="heard_from"
        required={required}
        className={className}
        defaultValue="Media"
        aria-invalid={ariaInvalid}
        onChange={onChange}
      >
        <option value="Media">{tx("Media")}</option>
        <option value="Referals">{tx("Referals")}</option>
        <option value="Social Media">{tx("Social Media")}</option>
        <option value="Events">{tx("Events")}</option>
      </select>
    );
  }

  return (
    <select
      name="heard_from"
      required={required}
      className={className}
      defaultValue=""
      aria-invalid={ariaInvalid}
      onChange={onChange}
    >
      <option value="" disabled>
        {tx("Select an option")}
      </option>
      <option value="Search Engine">{tx("Search Engine")}</option>
      <option value="Social Media">{tx("Social Media")}</option>
      <option value="Referrals">{tx("Referrals")}</option>
      <option value="Events">{tx("Events")}</option>
      <option value="LinkedIn">{tx("LinkedIn")}</option>
      <option value="Media">{tx("Media")}</option>
      <option value="Other">{tx("Other")}</option>
    </select>
  );
}
