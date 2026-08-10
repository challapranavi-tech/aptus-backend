"use client";

import { useState } from "react";
import type { BankTransferDetails } from "@/lib/server/bank-transfer";

type FieldRow = { label: string; value: string };

function CopyActionButton({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — value remains visible/selectable.
    }
  }

  return (
    <button type="button" className="aptus-copy-btn" onClick={handleCopy}>
      {copied ? "Copied" : label}
    </button>
  );
}

export function BankTransferDetailsCard({
  details,
  paymentReference,
}: {
  details: BankTransferDetails;
  paymentReference?: string | null;
}) {
  const rows: FieldRow[] = [
    { label: "Company Name", value: details.companyName },
    { label: "Bank Name", value: details.bankName },
    { label: "Account Name", value: details.accountName },
    { label: "Account No.", value: details.accountNumber },
    { label: "IBAN", value: details.iban },
    { label: "SWIFT/BIC", value: details.swiftBic },
    ...(details.branch ? [{ label: "Branch", value: details.branch }] : []),
  ];

  const copyActions = [
    details.accountNumber
      ? { label: "Copy Account Number", value: details.accountNumber }
      : null,
    details.iban ? { label: "Copy IBAN", value: details.iban } : null,
    details.swiftBic ? { label: "Copy SWIFT", value: details.swiftBic } : null,
    paymentReference?.trim()
      ? { label: "Copy Order ID", value: paymentReference.trim() }
      : null,
  ].filter((action): action is { label: string; value: string } => action != null);

  return (
    <div className="aptus-bank-card">
      <header className="aptus-bank-card__head">
        <span aria-hidden="true" className="aptus-bank-card__rule" />
        <h3>Bank Transfer Details</h3>
        <span aria-hidden="true" className="aptus-bank-card__rule" />
      </header>

      <dl className="aptus-bank-card__fields">
        {rows.map((row) => (
          <div className="aptus-bank-card__field" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {paymentReference?.trim() ? (
        <div className="aptus-bank-card__reference">
          <p>Payment Reference (Order ID):</p>
          <strong>{paymentReference.trim()}</strong>
        </div>
      ) : null}

      {paymentReference?.trim() ? (
        <p className="aptus-bank-card__hint">
          Please include the above Order ID as the payment reference when making your bank transfer.
        </p>
      ) : null}

      {copyActions.length > 0 ? (
        <div className="aptus-bank-card__actions">
          {copyActions.map((action) => (
            <CopyActionButton key={action.label} label={action.label} value={action.value} />
          ))}
        </div>
      ) : null}

      <footer className="aptus-bank-card__foot" aria-hidden="true">
        <span className="aptus-bank-card__rule" />
      </footer>
    </div>
  );
}
