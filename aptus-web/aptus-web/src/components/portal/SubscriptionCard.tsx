"use client";

import { useState } from "react";
import { authFetch } from "@/lib/access-token";
import { notifyPortalDataChanged } from "@/lib/portal-data-events";
import { CancellationConfirmModal } from "./CancellationConfirmModal";
import { RenewalConfirmModal } from "./RenewalConfirmModal";
import type { SubscriptionItem, SubscriptionRequestType } from "@/types/subscriptions";

const MASKED_LICENSE = "••••••••••••";

function statusClass(status: SubscriptionItem["status"]): string {
  switch (status) {
    case "Active":
      return "aptus-status--active";
    case "Expiring Soon":
      return "aptus-status--due-soon";
    case "Cancelled":
      return "aptus-status--canceled";
    case "Expired":
    default:
      return "aptus-status--expired";
  }
}

type SubscriptionCardProps = {
  subscription: SubscriptionItem;
  onActionComplete?: () => void;
};

export function SubscriptionCard({ subscription, onActionComplete }: SubscriptionCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState<SubscriptionRequestType | "cancel" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationPhase, setCancellationPhase] = useState<"confirm" | "complete">("confirm");
  const hasLicense = Boolean(subscription.licenseKey?.trim());
  const isActive =
    subscription.status === "Active" || subscription.status === "Expiring Soon";

  const licenseDisplay = !hasLicense
    ? "Not assigned yet"
    : revealed
      ? subscription.licenseKey
      : MASKED_LICENSE;

  async function submitRequest(requestType: SubscriptionRequestType) {
    setBusy(requestType);
    setFeedback(null);
    try {
      const response = await authFetch("/api/subscriptions/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: subscription.productName,
          requestType,
          orderId: subscription.orderId,
          lineId: subscription.lineId,
          renewalDateIso: subscription.renewalDateIso,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        showConfirmationModal?: boolean;
      };
      if (!response.ok) {
        setFeedback(data.error ?? "Request failed. Please try again.");
        return;
      }
      if (requestType === "renew" && data.showConfirmationModal) {
        setShowRenewalModal(true);
      } else {
        setFeedback(data.message ?? "Request submitted.");
      }
      notifyPortalDataChanged("subscriptions");
      onActionComplete?.();
    } catch {
      setFeedback("Request failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function openCancellationPrompt() {
    setFeedback(null);
    setCancellationPhase("confirm");
    setShowCancellationModal(true);
  }

  function closeCancellationModal() {
    if (busy === "cancel") return;
    const wasComplete = cancellationPhase === "complete";
    setShowCancellationModal(false);
    setCancellationPhase("confirm");
    if (wasComplete) {
      notifyPortalDataChanged("subscriptions");
    }
  }

  async function confirmCancellation() {
    setBusy("cancel");
    setFeedback(null);
    try {
      const response = await authFetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: subscription.productName,
          orderId: subscription.orderId,
          lineId: subscription.lineId,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        showConfirmationModal?: boolean;
      };
      if (!response.ok) {
        setFeedback(data.error ?? "Cancellation failed. Please try again.");
        closeCancellationModal();
        return;
      }

      if (data.showConfirmationModal) {
        setCancellationPhase("complete");
      } else {
        setFeedback(data.message ?? "Subscription cancelled.");
        closeCancellationModal();
      }
      notifyPortalDataChanged("subscriptions");
      onActionComplete?.();
    } catch {
      setFeedback("Cancellation failed. Please try again.");
      closeCancellationModal();
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="aptus-lifecycle-card aptus-subscription-card">
      <div className="aptus-lifecycle-card__top">
        <div className="aptus-product-card__icon" aria-hidden="true">
          {subscription.productName.slice(0, 3).toUpperCase()}
        </div>
        <div>
          <span>Subscription</span>
          <h3>{subscription.productName}</h3>
        </div>
        <mark className={`aptus-status ${statusClass(subscription.status)}`}>
          {subscription.status}
        </mark>
      </div>

      <div className="aptus-lifecycle-card__meta">
        <div>
          <span>Product name</span>
          <strong>{subscription.productName}</strong>
        </div>
        <div>
          <span>Purchase date</span>
          <strong>{subscription.purchaseDate || "—"}</strong>
        </div>
        <div>
          <span>Renewal date</span>
          <strong>{subscription.renewalDate || "—"}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{subscription.status}</strong>
        </div>
      </div>

      <div className="aptus-license-id">
        <span>License ID</span>
        <div className="aptus-license-id__value">
          <strong
            className={!hasLicense ? "aptus-license-id__pending" : ""}
            data-testid="license-display"
          >
            {licenseDisplay}
          </strong>
          {hasLicense ? (
            <button
              type="button"
              className="aptus-license-id__toggle"
              aria-label={revealed ? "Hide license ID" : "Reveal license ID"}
              aria-pressed={revealed}
              title={revealed ? "Hide license ID" : "Show license ID"}
              onClick={() => setRevealed((value) => !value)}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {isActive ? (
        <div className="aptus-lifecycle-card__actions">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void submitRequest("renew")}
          >
            {busy === "renew" ? "Submitting…" : "Renew"}
          </button>
          <button
            type="button"
            className="aptus-btn--ghost"
            disabled={busy !== null}
            onClick={openCancellationPrompt}
          >
            {busy === "cancel" ? "Cancelling…" : "Cancel subscription"}
          </button>
        </div>
      ) : null}

      {feedback ? (
        <p className="aptus-subscription-card__feedback" role="status">
          {feedback}
        </p>
      ) : null}

      <RenewalConfirmModal
        open={showRenewalModal}
        onClose={() => {
          setShowRenewalModal(false);
          notifyPortalDataChanged("subscriptions");
        }}
      />
      <CancellationConfirmModal
        open={showCancellationModal}
        productName={subscription.productName}
        busy={busy === "cancel"}
        phase={cancellationPhase}
        onConfirm={() => void confirmCancellation()}
        onClose={closeCancellationModal}
      />
    </article>
  );
}
