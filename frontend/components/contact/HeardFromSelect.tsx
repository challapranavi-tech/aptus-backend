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
        <option value="Media">Media</option>
        <option value="Referals">Referals</option>
        <option value="Social Media">Social Media</option>
        <option value="Events">Events</option>
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
