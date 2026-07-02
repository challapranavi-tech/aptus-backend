import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type SoftwareQuoteFormProps = {
  submitLabel?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"form">, "className" | "action" | "method" | "children">;

export function SoftwareQuoteForm({
  submitLabel = "Submit Now",
  className,
  ...formProps
}: SoftwareQuoteFormProps) {
  return (
    <form
      className={cn("relative mt-8 w-full text-left", className)}
      action="#"
      method="post"
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
            <option value="Civil 3D ">Civil 3D </option>
            <option value="Architecture Engineering & Construction Collection IC">
              Architecture Engineering &amp; Construction Collection IC
            </option>
            <option value="AutoCAD LT ">AutoCAD LT </option>
            <option value="BIM Collaborate Pro CLOUD">BIM Collaborate Pro CLOUD</option>
            <option value="3ds Max">3ds Max</option>
            <option value="Build - 550 CLOUD">Build - 550 CLOUD</option>
            <option value="Docs CLOUD">Docs CLOUD</option>
            <option value="BIM Collaborate CLOUD">BIM Collaborate CLOUD</option>
            <option value="BIM 360 Build - Packs CLOUD">BIM 360 Build - Packs CLOUD</option>
            <option value="InfraWorks">InfraWorks</option>
            <option value="Navisworks Manage ">Navisworks Manage </option>
            <option value="Revit ">Revit </option>
            <option value="InfoWater Pro ">InfoWater Pro </option>
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
      <div className="mt-5">
        <button type="submit" className="aptus-form-submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
