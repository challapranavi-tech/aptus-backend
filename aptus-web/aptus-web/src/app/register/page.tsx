"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthCardFoot } from "@/components/auth/AuthCardFoot";
import { Footer } from "@/components/layout/Footer";
import type { UserType } from "@/types/profile";

type RegisterStep =
  | "user-type"
  | "identify"
  | "existing"
  | "otp"
  | "reset-password"
  | "register";

const USER_TYPE_OPTIONS: Array<{ value: UserType; label: string; hint: string }> = [
  {
    value: "oman_company",
    label: "Oman Company",
    hint: "Registered business in Oman",
  },
  {
    value: "outside_oman",
    label: "Outside Oman",
    hint: "International or non-Omani company",
  },
  {
    value: "individual",
    label: "Individual",
    hint: "Personal customer account",
  },
];

function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<RegisterStep>("user-type");
  const [userType, setUserType] = useState<UserType>("oman_company");
  const [identifier, setIdentifier] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpChannel, setOtpChannel] = useState<"email" | "sms">("email");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [password, setPassword] = useState("");

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
    if (nameParam) setName(nameParam);
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

  function resetError() {
    setError("");
  }

  async function handleCheckIdentification(e: FormEvent) {
    e.preventDefault();
    resetError();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/check-identification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          identifier: identifier.trim(),
          pendingEmail: email.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to verify identification. Please try again.");
        return;
      }

      if (data.exists) {
        setRecoveryToken(data.recoveryToken);
        setMaskedEmail(data.maskedEmail);
        setMaskedPhone(data.maskedPhone);
        setStep("existing");
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
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryToken, otp, password: newPassword }),
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
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userType,
          name,
          companyName: isCompany ? companyName : undefined,
          region,
          email,
          phone,
          crNumber: isCompany ? crNumber : undefined,
          password,
          country: userType === "oman_company" ? "Oman" : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function stepTitle(): string {
    switch (step) {
      case "user-type":
        return "Select user type";
      case "identify":
        return isCompany ? "Enter CR number" : "Enter mobile number";
      case "existing":
        return "Account already exists";
      case "otp":
        return "Verify your identity";
      case "reset-password":
        return "Reset password";
      case "register":
        return "Complete registration";
      default:
        return "Register";
    }
  }

  return (
    <div id="wrap" className="aptus-site aptus-customer-auth" data-aptus-auth-page="register">
      <main className="aptus-auth">
        <section className="aptus-auth__hero aptus-auth__hero--register">
          <div className="container">
            <div className="aptus-auth__intro aptus-auth__intro--register">
              <span className="aptus-section__eyebrow">New contact</span>
              <h1>Register for portal access</h1>
              <p>
                Create your customer account to access the portal and manage your Aptus services
                online.
              </p>
            </div>

            <div className="aptus-auth-card aptus-register-form">
              <div className="aptus-auth-card__head">
                <span>Step {stepNumber(step)} of 3</span>
                <h2>{stepTitle()}</h2>
              </div>

              <div className="aptus-register-steps" aria-label="Registration progress">
                <span className={stepClass(step, "user-type")}>User type</span>
                <span className={stepClass(step, "identify")}>Identification</span>
                <span className={stepClass(step, "register", "existing", "otp", "reset-password")}>
                  Account
                </span>
              </div>

              {showNoAccountBanner && step === "user-type" && (
                <div className="aptus-auth-alert is-error" role="alert">
                  <strong>No portal account found.</strong> Select your user type and enter your CR
                  number or mobile to continue registration.
                  {email && (
                    <>
                      {" "}
                      Email <strong>{email}</strong> will be used for your account.
                    </>
                  )}
                </div>
              )}

              {showExistingPartnerBanner && step === "user-type" && (
                <div className="aptus-auth-alert" role="alert">
                  <strong>Existing customer record found.</strong> We found a record for this email.
                  Select your user type and confirm your CR number or mobile to complete portal
                  access.
                  {email && (
                    <>
                      {" "}
                      Email: <strong>{email}</strong>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="aptus-auth-alert is-error" role="alert">
                  {error}
                </div>
              )}

              {step === "user-type" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep("identify");
                  }}
                >
                  <fieldset className="aptus-register-form__type aptus-register-form__type--cards">
                    <legend className="visually-hidden">User type</legend>
                    {USER_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`aptus-register-type-card${
                          userType === option.value ? " is-selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="userType"
                          value={option.value}
                          checked={userType === option.value}
                          onChange={() => {
                            setUserType(option.value);
                            setIdentifier("");
                          }}
                        />
                        <span className="aptus-register-type-card__label">{option.label}</span>
                        <span className="aptus-register-type-card__hint">{option.hint}</span>
                      </label>
                    ))}
                  </fieldset>
                  <button type="submit" className="btn btn-aptus-primary w-100">
                    Continue
                  </button>
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
                    <input
                      id="register_identifier"
                      className="form-control"
                      type={isCompany ? "text" : "tel"}
                      name="identifier"
                      inputMode={isCompany ? "text" : "tel"}
                      autoComplete={isCompany ? "off" : "tel"}
                      required
                      placeholder={
                        isCompany
                          ? "Enter commercial registration number"
                          : "Enter mobile number"
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                  <div className="aptus-register-form__actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setStep("user-type")}
                    >
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
                    <h3 id="existing-title">
                      {isCompany ? "CR Number Already Exists" : "Mobile Number Already Exists"}
                    </h3>
                    <p className="aptus-register-existing__lead">
                      An account is already registered with this{" "}
                      {isCompany ? "CR number" : "mobile number"}.
                    </p>
                    <div className="aptus-register-existing__account">
                      <span>Account created by:</span>
                      <p>
                        <strong>Email:</strong> {maskedEmail}
                      </p>
                      <p>
                        <strong>Phone:</strong> {maskedPhone}
                      </p>
                    </div>
                    <p className="aptus-register-existing__hint">
                      Please use forgot password to access your account. We will send a one-time
                      code to verify your identity.
                    </p>
                  </div>
                  <div className="aptus-register-form__actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setStep("identify")}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-aptus-primary"
                      onClick={() => setStep("otp")}
                    >
                      Continue to recovery
                    </button>
                  </div>
                </div>
              )}

              {step === "otp" && (
                <form onSubmit={handleSendOtp}>
                  <p className="aptus-register-form__section-label">Send OTP via</p>
                  <fieldset className="aptus-register-form__type">
                    <legend className="visually-hidden">OTP channel</legend>
                    <label className="aptus-register-form__type-option">
                      <input
                        type="radio"
                        name="otpChannel"
                        value="email"
                        checked={otpChannel === "email"}
                        onChange={() => setOtpChannel("email")}
                      />
                      <span>Email OTP</span>
                    </label>
                    <label className="aptus-register-form__type-option">
                      <input
                        type="radio"
                        name="otpChannel"
                        value="sms"
                        checked={otpChannel === "sms"}
                        onChange={() => setOtpChannel("sms")}
                      />
                      <span>SMS OTP</span>
                    </label>
                  </fieldset>
                  <div className="aptus-register-form__actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setStep("existing")}
                    >
                      Back
                    </button>
                    <button type="submit" className="btn btn-aptus-primary" disabled={loading}>
                      {loading ? "Sending…" : "Send OTP"}
                    </button>
                  </div>
                </form>
              )}

              {step === "reset-password" && (
                <form onSubmit={handleResetPassword}>
                  {otpSent && (
                    <div className="aptus-auth-alert" role="status">
                      Verification code sent via {otpChannel === "email" ? "email" : "SMS"}.
                      {demoOtp && (
                        <>
                          {" "}
                          For testing, use code: <strong>{demoOtp}</strong>
                        </>
                      )}
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
                      placeholder="0000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <div className="aptus-field">
                    <label htmlFor="register_new_password">New password</label>
                    <input
                      id="register_new_password"
                      className="form-control"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="aptus-register-form__actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setStep("otp")}
                    >
                      Back
                    </button>
                    <button type="submit" className="btn btn-aptus-primary" disabled={loading}>
                      {loading ? "Resetting…" : "Reset password"}
                    </button>
                  </div>
                </form>
              )}

              {step === "register" && (
                <form onSubmit={handleRegister}>
                  <div className="aptus-register-form__details aptus-register-form__details--compact">
                    <div className="aptus-field">
                      <label htmlFor="register_name">Name</label>
                      <input
                        id="register_name"
                        className="form-control"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {isCompany && (
                      <div className="aptus-field">
                        <label htmlFor="register_company">Company name</label>
                        <input
                          id="register_company"
                          className="form-control"
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
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
                            className="form-control"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="aptus-field">
                          <label htmlFor="register_phone">Mobile</label>
                          <input
                            id="register_phone"
                            className="form-control"
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="aptus-field">
                          <label htmlFor="register_email">Email</label>
                          <input
                            id="register_email"
                            className="form-control"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="aptus-field">
                          <label htmlFor="register_phone">Mobile Number</label>
                          <input
                            id="register_phone"
                            className="form-control"
                            type="tel"
                            readOnly
                            required
                            value={phone}
                            aria-readonly="true"
                          />
                        </div>
                      </>
                    )}

                    {isCompany && (
                      <div className="aptus-field">
                        <label htmlFor="register_cr">CR number</label>
                        <input
                          id="register_cr"
                          className="form-control"
                          type="text"
                          required
                          value={crNumber}
                          onChange={(e) => setCrNumber(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="aptus-field">
                      <label htmlFor="register_password">Password</label>
                      <input
                        id="register_password"
                        className="form-control"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="aptus-register-form__actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setStep("identify")}
                    >
                      Back
                    </button>
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

      <Footer />
    </div>
  );
}

function stepNumber(step: RegisterStep): number {
  if (step === "user-type") return 1;
  if (step === "identify") return 2;
  return 3;
}

function stepClass(step: RegisterStep, ...targets: RegisterStep[]): string {
  const order: RegisterStep[] = [
    "user-type",
    "identify",
    "existing",
    "otp",
    "reset-password",
    "register",
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
