"use client";

import { FormEvent, useEffect, useState } from "react";
import { authFetch } from "@/lib/access-token";
import { useAuth } from "@/context/AuthProvider";
import { normalizePhone } from "@/lib/phone";
import type { ClientProfile } from "@/types/profile";

type FormState = {
  name: string;
  phone: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  website: string;
  language: string;
  tags: string;
};

function toFormState(profile: ClientProfile): FormState {
  return {
    name: profile.name ?? "",
    phone: normalizePhone(profile.phone ?? ""),
    street: profile.street ?? "",
    street2: profile.street2 ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    zip: profile.zip ?? "",
    country: profile.country ?? "",
    website: profile.website ?? "",
    language: profile.language ?? "en_US",
    tags: profile.tags ?? "",
  };
}

/** Account details editor — calls the same /api/auth/profile the rest of the auth flow uses. */
export function ProfilePanel() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState<FormState | null>(user ? toFormState(user) : null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm((current) => current ?? toFormState(user));
  }, [user]);

  if (!user || !form) {
    return (
      <section className="aptus-dashboard-card aptus-profile-card">
        <p>Loading your profile…</p>
      </section>
    );
  }

  const isCompany = user.contactType === "company";
  const phoneLocked = !isCompany;
  const phoneValue = phoneLocked ? normalizePhone(user.phone ?? "") : form.phone;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage("");
    setError("");

    // Identity fields stay out of the PATCH body: person phone + company CR/taxId.
    const payload = isCompany ? form : { ...form, phone: undefined };

    try {
      const response = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to save profile.");
        return;
      }

      setMessage("Profile updated successfully.");
      await refreshUser();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="aptus-dashboard-card aptus-profile-card">
      <form className="aptus-profile-form aptus-register-form" onSubmit={handleSubmit}>
        <div className="aptus-field">
          <label htmlFor="profile_name">{isCompany ? "Company name" : "Contact name"}</label>
          <input
            id="profile_name"
            className="form-control"
            type="text"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_email">Email</label>
          <input
            id="profile_email"
            className="form-control"
            type="email"
            value={user.email}
            disabled
            aria-disabled="true"
            title="Email cannot be changed"
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_phone">Phone</label>
          <input
            id="profile_phone"
            className="form-control"
            type="tel"
            value={phoneValue}
            disabled={phoneLocked}
            readOnly={phoneLocked}
            aria-disabled={phoneLocked ? "true" : undefined}
            aria-readonly={phoneLocked ? "true" : undefined}
            title={phoneLocked ? "Phone number is unique and cannot be changed" : undefined}
            onChange={
              phoneLocked ? undefined : (e) => updateField("phone", normalizePhone(e.target.value))
            }
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_street">Street</label>
          <input
            id="profile_street"
            className="form-control"
            type="text"
            value={form.street}
            onChange={(e) => updateField("street", e.target.value)}
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_street2">Street 2</label>
          <input
            id="profile_street2"
            className="form-control"
            type="text"
            value={form.street2}
            onChange={(e) => updateField("street2", e.target.value)}
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_city">City</label>
          <input
            id="profile_city"
            className="form-control"
            type="text"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_state">State</label>
          <input
            id="profile_state"
            className="form-control"
            type="text"
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_zip">ZIP</label>
          <input
            id="profile_zip"
            className="form-control"
            type="text"
            value={form.zip}
            onChange={(e) => updateField("zip", e.target.value)}
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_country">Country</label>
          <input
            id="profile_country"
            className="form-control"
            type="text"
            value={form.country}
            onChange={(e) => updateField("country", e.target.value)}
          />
        </div>

        {isCompany ? (
          <div className="aptus-field">
            <label htmlFor="profile_cr">Tax ID</label>
            <input
              id="profile_cr"
              className="form-control"
              type="text"
              value={user.taxId ?? ""}
              disabled
              readOnly
              aria-disabled="true"
              aria-readonly="true"
              title="Tax ID is unique and cannot be changed"
            />
          </div>
        ) : null}

        <div className="aptus-field">
          <label htmlFor="profile_website">Website</label>
          <input
            id="profile_website"
            className="form-control"
            type="url"
            placeholder="https://www.example.com"
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
          />
        </div>

        <div className="aptus-field">
          <label htmlFor="profile_tags">Tags</label>
          <input
            id="profile_tags"
            className="form-control"
            type="text"
            placeholder="e.g. B2B, VIP, Consulting"
            value={form.tags}
            onChange={(e) => updateField("tags", e.target.value)}
          />
        </div>

        <div className="aptus-profile-form__actions">
          <button type="submit" className="btn btn-aptus-primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile updates"}
          </button>
          <span aria-live="polite">
            {error ? <span className="aptus-field__error">{error}</span> : message}
          </span>
        </div>
      </form>
    </section>
  );
}
