type RenewalSerialNumberFieldProps = {
  id: string;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
  className?: string;
};

/** Required when a renewal-kind product uses License Type = Renewal. */
export function RenewalSerialNumberField({
  id,
  value,
  error,
  onChange,
  className,
}: RenewalSerialNumberFieldProps) {
  return (
    <div className={["aptus-renewal-serial", className].filter(Boolean).join(" ")}>
      <label htmlFor={id}>
        <span>Serial number</span>
        <input
          id={id}
          type="text"
          value={value}
          required
          aria-required="true"
          aria-invalid={error ? true : undefined}
          placeholder="Enter your existing license serial"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {error ? (
        <p className="aptus-renewal-serial__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
