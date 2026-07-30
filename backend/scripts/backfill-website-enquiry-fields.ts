/**
 * Backfill Enquiry Reference + Website Enquiry = "Contact Form" on existing
 * website-created contacts. Does not touch Request Quote / crm.lead.
 *
 * Dry-run (default):
 *   npx --yes tsx --env-file=.env.local scripts/backfill-website-enquiry-fields.ts
 *
 * Apply:
 *   npx --yes tsx --env-file=.env.local scripts/backfill-website-enquiry-fields.ts --apply
 *
 * Optional: --limit=200
 */
import {
  backfillWebsiteEnquiryFields,
  resolvePartnerEnquiryFields,
} from "../lib/odoo/enquiry";
import { getOdooServiceSession, isOdooConfigured } from "../lib/odoo/client";

async function main() {
  const apply = process.argv.includes("--apply");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 500;

  if (!isOdooConfigured()) {
    throw new Error("Odoo is not configured (ODOO_URL/DB/USER/API_KEY).");
  }

  const session = await getOdooServiceSession();
  const fields = await resolvePartnerEnquiryFields(session);
  console.log("Resolved fields:", fields);
  console.log(apply ? "Mode: APPLY" : "Mode: DRY-RUN (pass --apply to write)");

  const result = await backfillWebsiteEnquiryFields({
    limit: Number.isInteger(limit) && limit > 0 ? limit : 500,
    dryRun: !apply,
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
