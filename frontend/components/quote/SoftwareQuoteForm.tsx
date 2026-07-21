"use client";

import { publicApiBase } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import { useState, type ComponentPropsWithoutRef, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

type SoftwareQuoteFormProps = {
  submitLabel?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"form">, "className" | "action" | "method" | "children" | "onSubmit">;

export function SoftwareQuoteForm({
  submitLabel = "Submit Now",
  className,
  ...formProps
}: SoftwareQuoteFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

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
        setMessage("Thank you! Your request has been submitted.");
        e.currentTarget.reset();
        return;
      }

      let msg = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        if (data.errors && typeof data.errors === "object") {
          const parts = Object.values(data.errors as Record<string, string>);
          if (parts.length) msg = parts.join(" ");
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
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="aptus-form-label">
          First Name *
          <input type="text" name="first_name" required className="aptus-form-input mt-0 w-full px-4 py-3" />
        </label>
        <label className="aptus-form-label">
          Last Name *
          <input type="text" name="last_name" required className="aptus-form-input mt-0 w-full px-4 py-3" />
        </label>
        <label className="aptus-form-label">
          Email *
          <input
            type="email"
            name="email"
            placeholder="Official Email"
            required
            className="aptus-form-input mt-0 w-full px-4 py-3"
          />
        </label>
        <label className="aptus-form-label">
          Company *
          <input
            type="text"
            name="company"
            placeholder="Company Name"
            required
            className="aptus-form-input mt-0 w-full px-4 py-3"
          />
        </label>
        <label className="aptus-form-label">
          Autodesk Product
          <select name="product" className="aptus-form-input mt-0 w-full px-4 py-3" defaultValue="Select Product">
            <option value="Select Product">Select Product</option>
            <option value="AutoCAD - including specialized toolsets AD">AutoCAD - including specialized toolsets AD</option>
            <option value="Civil 3D">Civil 3D</option>
            <option value="Architecture Engineering & Construction Collection IC">
              Architecture Engineering &amp; Construction Collection IC
            </option>
            <option value="AutoCAD LT">AutoCAD LT</option>
            <option value="BIM Collaborate Pro CLOUD">BIM Collaborate Pro CLOUD</option>
            <option value="3ds Max">3ds Max</option>
            <option value="Build - 550 CLOUD">Build - 550 CLOUD</option>
            <option value="Docs CLOUD">Docs CLOUD</option>
            <option value="BIM Collaborate CLOUD">BIM Collaborate CLOUD</option>
            <option value="BIM 360 Build - Packs CLOUD">BIM 360 Build - Packs CLOUD</option>
            <option value="InfraWorks">InfraWorks</option>
            <option value="Navisworks Manage">Navisworks Manage</option>
            <option value="Revit">Revit</option>
            <option value="InfoWater Pro">InfoWater Pro</option>
            <option value="Others">Others</option>
          </select>
        </label>
        <label className="aptus-form-label">
          Phone *
          <input
            type="tel"
            name="phone"
            placeholder="e.g.+ 968 0000 0000"
            required
            className="aptus-form-input mt-0 w-full px-4 py-3"
          />
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
