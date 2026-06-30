"use client";

import { FormEvent, useState } from "react";
import type { AutodeskProductLeadType } from "@/types/autodesk-product";

type AutodeskProductLeadFormProps = {
  productSlug: string;
  productName: string;
};

const TABS: { id: AutodeskProductLeadType; label: string }[] = [
  { id: "quote", label: "Request Quote" },
  { id: "demo", label: "Book Demo" },
  { id: "contact", label: "Contact" },
  { id: "download", label: "Download Brochure" },
];

export function AutodeskProductLeadForm({ productSlug, productName }: AutodeskProductLeadFormProps) {
  const [leadType, setLeadType] = useState<AutodeskProductLeadType>("quote");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/products/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType,
          productSlug,
          productName,
          name,
          email,
          phone,
          company,
          message,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Submission failed");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setMessage("");
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Submission failed");
    }
  }

  if (status === "success") {
    return (
      <div className="autodesk-lead__success">
        <h3>Thank you</h3>
        <p>Our Autodesk specialists will contact you shortly regarding {productName}.</p>
        <button type="button" className="autodesk-btn autodesk-btn--secondary" onClick={() => setStatus("idle")}>
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form className="autodesk-lead" onSubmit={onSubmit}>
      <div className="autodesk-lead__tabs" role="tablist" aria-label="Request type">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={leadType === tab.id}
            className={`autodesk-lead__tab${leadType === tab.id ? " is-active" : ""}`}
            onClick={() => setLeadType(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="autodesk-lead__grid">
        <label className="autodesk-field">
          <span>Name *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="autodesk-field">
          <span>Email *</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="autodesk-field">
          <span>Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </label>
        <label className="autodesk-field">
          <span>Company</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
        </label>
      </div>

      <label className="autodesk-field">
        <span>Message</span>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Tell us about your ${productName} requirements…`}
        />
      </label>

      {error ? <p className="autodesk-lead__error">{error}</p> : null}

      <button type="submit" className="autodesk-btn autodesk-btn--primary" disabled={status === "loading"}>
        {status === "loading" ? "Submitting…" : "Submit Request"}
      </button>
    </form>
  );
}
