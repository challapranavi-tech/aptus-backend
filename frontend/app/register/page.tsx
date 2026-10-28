"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthCardFoot } from "@/components/auth/AuthCardFoot";
import { toE164, toLocalPhoneDigits } from "@/lib/phone";
import type { UserType } from "@/types/profile";

type RegisterStep =
  | "user-type"
  | "identify"
  | "existing"
  | "otp"
  | "verify-otp"
  | "reset-password"
  | "register";

const USER_TYPE_OPTIONS: Array<{ value: UserType; label: string; hint: string }> = [
  { value: "oman_company", label: "Oman Company", hint: "Registered business in Oman" },
  { value: "outside_oman", label: "Outside Oman", hint: "International or non-Omani company" },
  { value: "individual", label: "Individual", hint: "Personal customer account" },
];

const COUNTRY_CODES = [
  { code: "+968", label: "🇴🇲 +968", country: "Oman", digits: 8 },
  { code: "+966", label: "🇸🇦 +966", country: "Saudi Arabia", digits: 9 },
  { code: "+971", label: "🇦🇪 +971", country: "UAE", digits: 9 },
  { code: "+974", label: "🇶🇦 +974", country: "Qatar", digits: 8 },
  { code: "+973", label: "🇧🇭 +973", country: "Bahrain", digits: 8 },
  { code: "+965", label: "🇰🇼 +965", country: "Kuwait", digits: 8 },
  { code: "+91", label: "🇮🇳 +91", country: "India", digits: 10 },
  { code: "+92", label: "🇵🇰 +92", country: "Pakistan", digits: 10 },
  { code: "+880", label: "🇧🇩 +880", country: "Bangladesh", digits: 10 },
  { code: "+63", label: "🇵🇭 +63", country: "Philippines", digits: 10 },
  { code: "+94", label: "🇱🇰 +94", country: "Sri Lanka", digits: 9 },
  { code: "+44", label: "🇬🇧 +44", country: "UK", digits: 10 },
  { code: "+1", label: "🇺🇸 +1", country: "USA/Canada", digits: 10 },
];

function validateName(value: string, label = "Name"): string | null {
  if (!value.trim()) return `${label} is required.`;
  if (/^\s|\s$/.test(value)) return `${label} must not start or end with a space.`;
  if (/[,.\?\/\\;:'"!@#$%^&*()\[\]{}<>|`~]/.test(value)) return `${label} must not contain special characters.`;
  return null;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email is required.";
  if (/\s/.test(value)) return "Email must not contain spaces.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
  return null;
}

function validatePhone(value: string): string | null {
  if (!value.trim()) return "Mobile number is required.";
  if (/\s/.test(value)) return "Mobile number must not contain spaces.";
  if (!/^\d{6,15}$/.test(value.replace(/^\+/, ""))) return "Enter a valid mobile number (digits only).";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (/\s/.test(value)) return "Password must not contain spaces.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
    return "Password must contain uppercase, lowercase, and a number.";
  }
  return null;
}

function validateCr(value: string): string | null {
  if (!value.trim()) return "CR number is required.";
  if (/\s/.test(value)) return "CR number must not contain spaces.";
  return null;
}

function validateIdentifier(isCompany: boolean, value: string): string | null {
  return isCompany ? validateCr(value) : validatePhone(value);
}

function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  error,
  autoComplete = "new-password",
  placeholder = "Enter password",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          className={`form-control${error ? " is-invalid" : ""}`}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={8}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{ paddingRight: "2.75rem" }}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((v) => !v)}
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "#6b7280",
            lineHeight: 1,
          }}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      {error && (
        <small className="aptus-field__error" role="alert">{error}</small>
      )}
    </div>
  );
}

function PhoneWithCountryCode({
  phoneValue,
  countryCode,
  onPhoneChange,
  onCountryCodeChange,
  error,
  onBlur,
  readOnly = false,
}: {
  phoneValue: string;
  countryCode: string;
  onPhoneChange: (v: string) => void;
  onCountryCodeChange: (v: string) => void;
  error?: string;
  onBlur?: () => void;
  readOnly?: boolean;
}) {
  const localLength = COUNTRY_CODES.find((c) => c.code === countryCode)?.digits;
  return (
    <div>
      <div className="aptus-register-phone">
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          disabled={readOnly}
          className="form-control aptus-register-phone__code"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code} title={c.country}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          className={`form-control aptus-register-phone__number${error ? " is-invalid" : ""}`}
          type="tel"
          required
          readOnly={readOnly}
          aria-readonly={readOnly}
          placeholder="Enter number"
          value={phoneValue}
          onChange={(e) => {
            const val = toLocalPhoneDigits(e.target.value, countryCode, localLength);
            onPhoneChange(val);
          }}
          onBlur={onBlur}
        />
      </div>
      {error && (
        <small className="aptus-field__error" role="alert">{error}</small>
      )}
    </div>
  );
}

function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<RegisterStep>("user-type");
  const [userType, setUserType] = useState<UserType>("oman_company");
  const [identifier, setIdentifier] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [existingTitle, setExistingTitle] = useState("Account Already Exists");
  const [otpChannel] = useState<"email" | "sms">("email");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastName, setLastName] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNameError, setCompanyNameError] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+968");
  const [phoneError, setPhoneError] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [crError, setCrError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isCompany = userType !== "individual";
  const reason = searchParams.get("reason");
  const showNoAccountBanner = reason === "no_account";
  const showExistingPartnerBanner = reason === "existing_partner";

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const nameParam = searchParams.get("name");
    const phoneParam = searchParams.get("phone");
    const crParam = searchParams.get("cr");
    const companyParam = searchParams.get("company");

    if (emailParam) setEmail(emailParam);
    if (nameParam) {
      const [first = "", ...rest] = nameParam.trim().split(/\s+/);
      setFirstName(first);
      setLastName(rest.join(" "));
    }
    if (phoneParam) setPhone(phoneParam);
    if (crParam) setCrNumber(crParam);
    if (companyParam) setCompanyName(companyParam);

    if (crParam) {
      setUserType("oman_company");
      setIdentifier(crParam);
    } else if (phoneParam && !companyParam) {
      setUserType("individual");
      setIdentifier(phoneParam);
    }

    if (searchParams.get("recover") === "1") {
      setStep("identify");
      return;
    }

    setStep("user-type");
  }, [searchParams]);

  function resetError() { setError(""); }

  function validateRegisterForm(): boolean {
    const fnErr = validateName(firstName, "First name");
    const lnErr = validateName(lastName, "Last name");
    const eErr = validateEmail(email);
    const pErr = validatePhone(phone);
    const pwErr = validatePassword(password);
    const crErr = isCompany ? validateCr(crNumber) : null;
    const coErr = isCompany && !companyName.trim() ? "Company name is required." : null;

    setFirstNameError(fnErr ?? "");
    setLastNameError(lnErr ?? "");
    setEmailError(eErr ?? "");
    setPhoneError(pErr ?? "");
    setPasswordError(pwErr ?? "");
    if (crErr !== undefined) setCrError(crErr ?? "");
    if (coErr !== undefined) setCompanyNameError(coErr ?? "");

    return !fnErr && !lnErr && !eErr && !pErr && !pwErr && !crErr && !coErr;
  }

  async function handleCheckIdentification(e: FormEvent) {
    e.preventDefault();
    resetError();

    const iErr = validateIdentifier(isCompany, identifier);
    setIdentifierError(iErr ?? "");
    if (iErr) return;

    setLoading(true);
    try {
      const localLength = COUNTRY_CODES.find((c) => c.code === countryCode)?.digits;
      const checkIdentifier = isCompany
        ? identifier.trim()
        : toE164(countryCode, identifier, localLength);

      const response = await fetch("/api/auth/check-identification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          identifier: checkIdentifier,
          pendingEmail: email.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to verify identification. Please try again.");
        return;
      }

      if (data.exists) {
        showExistingAccount(data);
        return;
      }

      if (isCompany) {
        setCrNumber(identifier.trim());
      } else {
        setPhone(identifier.trim());
      }
      setStep("register");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function showExistingAccount(data: {
    maskedEmail?: string;
    maskedPhone?: string;
    recoveryToken?: string;
    conflictField?: string;
    error?: string;
  }) {
    setRecoveryToken(data.recoveryToken ?? "");
    setMaskedEmail(data.maskedEmail ?? "");
    setMaskedPhone(data.maskedPhone ?? "");
    if (data.conflictField === "cr" || (!data.conflictField && isCompany)) {
      setExistingTitle("CR Number Already Exists");
    } else if (data.conflictField === "mobile" || (!data.conflictField && !isCompany)) {
      setExistingTitle("Mobile Number Already Exists");
    } else {
      setExistingTitle(data.error || "Account Already Exists");
    }
    setStep("existing");
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryToken, channel: otpChannel }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to send verification code.");
        return;
      }

      setOtpSent(true);
      setDemoOtp(data.demoCode ?? "");
      setOtp("");
      setStep("verify-otp");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    resetError();
    if (!otp.trim()) {
      setError("Enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryToken, otp }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Invalid or expired verification code.");
        return;
      }

      setStep("reset-password");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    resetError();
    const pwErr = validatePassword(newPassword);
    setNewPasswordError(pwErr ?? "");
    if (pwErr) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryToken, password: newPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to reset password.");
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    resetError();
    if (!validateRegisterForm()) return;

    setLoading(true);
    try {
      const localLength = COUNTRY_CODES.find((c) => c.code === countryCode)?.digits;
      const fullPhone = toE164(countryCode, phone, localLength);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userType,
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          companyName: isCompany ? companyName : undefined,
          region,
          email,
          phone: fullPhone,
          crNumber: isCompany ? crNumber : undefined,
          password,
          country: userType === "oman_company" ? "Oman" : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409 && data.recoveryToken) {
          showExistingAccount(data);
          return;
        }
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      router.push(data.verificationRequired ? "/login?registered=1&verify=1" : "/login?registered=1");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function stepTitle(): string {
    switch (step) {
      case "user-type": return "Select user type";
      case "identify": return isCompany ? "Enter CR number" : "Enter mobile number";
      case "existing": return existingTitle;
      case "otp": return "Send OTP";
      case "verify-otp": return "Verify OTP";
      case "reset-password": return "Reset password";
      case "register": return "Complete registration";
      default: return "Register";
    }
  }

  return (
    <div id="wrap" className="aptus-site aptus-customer-auth" data-aptus-auth-page="register">
      <main className="aptus-auth">
        <section className="aptus-auth__hero aptus-auth__hero--register">
          <div className="container">
            <div className="aptus-auth__intro aptus-auth__intro--register">
              <h1>Register for portal access</h1>
              <p>
                Create your customer account to access the portal and manage your Aptus services
                online.
              </p>
            </div>

            <div className="aptus-auth-card aptus-register-form">
              <div className="aptus-auth-card__head">
                <h2>{stepTitle()}</h2>
              </div>

              <div className="aptus-register-steps" aria-label="Registration progress">
                <span className={stepClass(step, "user-type")}>User type</span>
                <span className={stepClass(step, "identify")}>Identification</span>
                <span className={stepClass(step, "register", "existing", "otp", "verify-otp", "reset-password")}>
                  Account
                </span>
              </div>

              {showNoAccountBanner && step === "user-type" && (
                <div className="aptus-auth-alert is-error" role="alert">
                  <strong>No portal account found.</strong> Select your user type and enter your CR
                  number or mobile to continue registration.
                  {email && <> Email <strong>{email}</strong> will be used for your account.</>}
                </div>
              )}

              {showExistingPartnerBanner && step === "user-type" && (
                <div className="aptus-auth-alert" role="alert">
                  <strong>Existing customer record found.</strong> We found a record for this email.
                  Select your user type and confirm your CR number or mobile to complete portal access.
                  {email && <> Email: <strong>{email}</strong></>}
                </div>
              )}

              {error && (
                <div className="aptus-auth-alert is-error" role="alert">{error}</div>
              )}

              {step === "user-type" && (
                <form onSubmit={(e) => { e.preventDefault(); setStep("identify"); }}>
                  <fieldset className="aptus-register-form__type aptus-register-form__type--cards">
                    <legend className="visually-hidden">User type</legend>
                    {USER_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`aptus-register-type-card${userType === option.value ? " is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="userType"
                          value={option.value}
                          checked={userType === option.value}
                          onChange={() => { setUserType(option.value); setIdentifier(""); }}
                        />
                        <span className="aptus-register-type-card__label">{option.label}</span>
                        <span className="aptus-register-type-card__hint">{option.hint}</span>
                      </label>
                    ))}
                  </fieldset>
                  <button type="submit" className="btn btn-aptus-primary w-100">Continue</button>
                </form>
              )}

              {step === "identify" && (
                <form key={userType} onSubmit={handleCheckIdentification}>
                  <p className="aptus-register-form__section-label">
                    {isCompany
                      ? "Enter your company CR number to verify your account."
                      : "Enter your registered mobile number to verify your account."}
                  </p>
                  <div className="aptus-field">
                    <label htmlFor="register_identifier">
                      {isCompany ? "CR Number" : "Mobile Number"}
                    </label>
                    {isCompany ? (
                      <>
                        <input
                          id="register_identifier"
                          className={`form-control${identifierError ? " is-invalid" : ""}`}
                          type="text"
                          name="identifier"
                          autoComplete="off"
                          required
                          placeholder="Enter commercial registration number"
                          value={identifier}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\s/g, "");
                            setIdentifier(val);
                            if (identifierError) setIdentifierError(validateCr(val) ?? "");
                          }}
                          onBlur={() => setIdentifierError(validateCr(identifier) ?? "")}
                        />
                        {identifierError && (
                          <small className="aptus-field__error" role="alert">{identifierError}</small>
                        )}
                      </>
                    ) : (
                      <PhoneWithCountryCode
                        phoneValue={identifier}
                        countryCode={countryCode}
                        onPhoneChange={(v) => {
                          setIdentifier(v);
                          if (identifierError) setIdentifierError(validatePhone(v) ?? "");
                        }}
                        onCountryCodeChange={setCountryCode}
                        error={identifierError}
                        onBlur={() => setIdentifierError(validatePhone(identifier) ?? "")}
                      />
                    )}
                  </div>
                  <div className="aptus-register-form__actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setStep("user-type")}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-aptus-primary" disabled={loading}>
                      {loading ? "Checking…" : "Continue"}
                    </button>
                  </div>
                </form>
              )}

              {step === "existing" && (
                <div className="aptus-register-existing">
                  <div className="aptus-register-existing__panel" role="alertdialog" aria-labelledby="existing-title">
                    <h3 id="existing-title">{existingTitle}</h3>
                    <div className="aptus-register-existing__account">
                      <span>Account Created By:</span>
                      <p><strong>Email:</strong> {maskedEmail || "****@****.***"}</p>
                      <p><strong>Phone:</strong> {maskedPhone || "+968 XXXXXXXX"}</p>
                    </div>
                    <p className="aptus-register-existing__hint">
                      Please use Forgot Password to access your account.
                    </p>
                  </div>
                  <div className="aptus-register-form__actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setStep("identify")}>Back</button>
                    <button type="button" className="btn btn-aptus-primary" onClick={() => setStep("otp")}>
                      Forgot Password
                    </button>
                  </div>
                </div>
              )}

              {step === "otp" && (
                <form onSubmit={handleSendOtp}>
                  <p className="aptus-register-form__section-label">
                    We will send a one-time code to verify your identity before you reset your password.
                  </p>
                  <fieldset className="aptus-register-form__type">
                    <legend className="visually-hidden">OTP channel</legend>
                    <label className="aptus-register-form__type-option">
                      <input type="radio" name="otpChannel" value="email" checked readOnly />
                      <span>Email OTP{maskedEmail ? ` (${maskedEmail})` : ""}</span>
                    </label>
                    {/* ponytail: SMS gateway not wired — hide until sendPasswordRecoveryOtp supports it */}
                  </fieldset>
                  <div className="aptus-register-form__actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setStep("existing")}>Back</button>
                    <button type="submit" className="btn btn-aptus-primary" disabled={loading}>{loading ? "Sending…" : "Send OTP"}</button>
                  </div>
                </form>
              )}

              {step === "verify-otp" && (
                <form onSubmit={handleVerifyOtp}>
                  {otpSent && (
                    <div className="aptus-auth-alert" role="status">
                      Verification code sent via {otpChannel === "email" ? "email" : "SMS"}.
                      {demoOtp && <> For testing, use code: <strong>{demoOtp}</strong></>}
                    </div>
                  )}
                  <div className="aptus-field">
                    <label htmlFor="register_otp">Verification code</label>
                    <input
                      id="register_otp"
                      className="form-control"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    />
                  </div>
                  <div className="aptus-register-form__actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setStep("otp")}>Back</button>
                    <button type="submit" className="btn btn-aptus-primary" disabled={loading}>
                      {loading ? "Verifying…" : "Verify OTP"}
                    </button>
                  </div>
                </form>
              )}

              {step === "reset-password" && (
                <form onSubmit={handleResetPassword}>
                  <p className="aptus-register-form__section-label">
                    Create a new password for your account, then sign in.
                  </p>
                  <div className="aptus-field">
                    <label htmlFor="register_new_password">New password</label>
                    <PasswordInput
                      id="register_new_password"
                      value={newPassword}
                      onChange={(v) => { setNewPassword(v); if (newPasswordError) setNewPasswordError(validatePassword(v) ?? ""); }}
                      onBlur={() => setNewPasswordError(validatePassword(newPassword) ?? "")}
                      error={newPasswordError}
                    />
                  </div>
                  <div className="aptus-register-form__actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setStep("verify-otp")}>Back</button>
                    <button type="submit" className="btn btn-aptus-primary" disabled={loading}>{loading ? "Resetting…" : "Reset password"}</button>
                  </div>
                </form>
              )}

              {step === "register" && (
                <form onSubmit={handleRegister}>
                  <div className="aptus-register-form__details aptus-register-form__details--compact">

                    <div className="aptus-register-form__row">
                      <div className="aptus-field">
                        <label htmlFor="register_first_name">First name</label>
                        <input
                          id="register_first_name"
                          className={`form-control${firstNameError ? " is-invalid" : ""}`}
                          type="text"
                          autoComplete="given-name"
                          required
                          value={firstName}
                          onChange={(e) => { setFirstName(e.target.value); if (firstNameError) setFirstNameError(validateName(e.target.value, "First name") ?? ""); }}
                          onBlur={() => setFirstNameError(validateName(firstName, "First name") ?? "")}
                        />
                        {firstNameError && <small className="aptus-field__error" role="alert">{firstNameError}</small>}
                      </div>
                      <div className="aptus-field">
                        <label htmlFor="register_last_name">Last name</label>
                        <input
                          id="register_last_name"
                          className={`form-control${lastNameError ? " is-invalid" : ""}`}
                          type="text"
                          autoComplete="family-name"
                          required
                          value={lastName}
                          onChange={(e) => { setLastName(e.target.value); if (lastNameError) setLastNameError(validateName(e.target.value, "Last name") ?? ""); }}
                          onBlur={() => setLastNameError(validateName(lastName, "Last name") ?? "")}
                        />
                        {lastNameError && <small className="aptus-field__error" role="alert">{lastNameError}</small>}
                      </div>
                    </div>

                    {isCompany && (
                      <div className="aptus-field">
                        <label htmlFor="register_company">Company name</label>
                        <input
                          id="register_company"
                          className={`form-control${companyNameError ? " is-invalid" : ""}`}
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => { setCompanyName(e.target.value); if (companyNameError) setCompanyNameError(e.target.value.trim() ? "" : "Company name is required."); }}
                          onBlur={() => setCompanyNameError(companyName.trim() ? "" : "Company name is required.")}
                        />
                        {companyNameError && <small className="aptus-field__error" role="alert">{companyNameError}</small>}
                      </div>
                    )}

                    <div className="aptus-field">
                      <label htmlFor="register_region">Region / area</label>
                      <input
                        id="register_region"
                        className="form-control"
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      />
                    </div>

                    {isCompany ? (
                      <div className="aptus-register-form__row">
                        <div className="aptus-field">
                          <label htmlFor="register_email">Email</label>
                          <input
                            id="register_email"
                            className={`form-control${emailError ? " is-invalid" : ""}`}
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value) ?? ""); }}
                            onBlur={() => setEmailError(validateEmail(email) ?? "")}
                          />
                          {emailError && <small className="aptus-field__error" role="alert">{emailError}</small>}
                        </div>
                        <div className="aptus-field">
                          <label htmlFor="register_phone">Mobile</label>
                          <PhoneWithCountryCode
                            phoneValue={phone}
                            countryCode={countryCode}
                            onPhoneChange={(v) => { setPhone(v); if (phoneError) setPhoneError(validatePhone(v) ?? ""); }}
                            onCountryCodeChange={setCountryCode}
                            error={phoneError}
                            onBlur={() => setPhoneError(validatePhone(phone) ?? "")}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="aptus-field">
                          <label htmlFor="register_email">Email</label>
                          <input
                            id="register_email"
                            className={`form-control${emailError ? " is-invalid" : ""}`}
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value) ?? ""); }}
                            onBlur={() => setEmailError(validateEmail(email) ?? "")}
                          />
                          {emailError && <small className="aptus-field__error" role="alert">{emailError}</small>}
                        </div>
                        <div className="aptus-field">
                          <label htmlFor="register_phone">Mobile Number</label>
                          <PhoneWithCountryCode
                            phoneValue={phone}
                            countryCode={countryCode}
                            onPhoneChange={(v) => { setPhone(v); if (phoneError) setPhoneError(validatePhone(v) ?? ""); }}
                            onCountryCodeChange={setCountryCode}
                            error={phoneError}
                            onBlur={() => setPhoneError(validatePhone(phone) ?? "")}
                            readOnly={true}
                          />
                        </div>
                      </>
                    )}

                    {isCompany && (
                      <div className="aptus-field">
                        <label htmlFor="register_cr">CR number</label>
                        <input
                          id="register_cr"
                          className={`form-control${crError ? " is-invalid" : ""}`}
                          type="text"
                          required
                          value={crNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\s/g, "");
                            setCrNumber(val);
                            if (crError) setCrError(validateCr(val) ?? "");
                          }}
                          onBlur={() => setCrError(validateCr(crNumber) ?? "")}
                        />
                        {crError && <small className="aptus-field__error" role="alert">{crError}</small>}
                      </div>
                    )}

                    <div className="aptus-field">
                      <label htmlFor="register_password">Password</label>
                      <PasswordInput
                        id="register_password"
                        value={password}
                        onChange={(v) => { setPassword(v); if (passwordError) setPasswordError(validatePassword(v) ?? ""); }}
                        onBlur={() => setPasswordError(validatePassword(password) ?? "")}
                        error={passwordError}
                      />
                    </div>
                  </div>

                  <div className="aptus-register-form__actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setStep("identify")}>Back</button>
                    <button type="submit" className="btn btn-aptus-primary" disabled={loading}>
                      {loading ? "Creating account…" : "Create account"}
                    </button>
                  </div>
                </form>
              )}

              <AuthCardFoot variant="register" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function stepClass(step: RegisterStep, ...targets: RegisterStep[]): string {
  const order: RegisterStep[] = [
    "user-type", "identify", "existing", "otp", "verify-otp", "reset-password", "register",
  ];
  const current = order.indexOf(step);
  const maxTarget = Math.max(...targets.map((target) => order.indexOf(target)));
  if (current === maxTarget) return "aptus-register-steps__item is-active";
  if (current > maxTarget) return "aptus-register-steps__item is-complete";
  return "aptus-register-steps__item";
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterWizard />
    </Suspense>
  );
}
