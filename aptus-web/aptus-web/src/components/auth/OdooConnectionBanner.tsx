"use client";

import { useEffect, useState } from "react";

type OdooStatus = {
  configured: boolean;
  connected: boolean;
  mode: "demo" | "live";
  message: string;
  demoMode: boolean;
};

export function OdooConnectionBanner() {
  const [status, setStatus] = useState<OdooStatus | null>(null);

  useEffect(() => {
    fetch("/api/odoo/status")
      .then((res) => res.json())
      .then((data: OdooStatus) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const connected = status.connected && status.mode === "live";

  return (
    <div
      className="preview-banner"
      style={{
        background: connected ? "#ecfdf5" : status.demoMode ? "#fffbeb" : "#fef2f2",
        borderTop: connected
          ? "1px solid #6ee7b7"
          : status.demoMode
            ? "1px solid #fcd34d"
            : "1px solid #fca5a5",
      }}
    >
      <strong>{connected ? "Odoo staging connected" : status.demoMode ? "Demo mode" : "Odoo not connected"}</strong>
      {" — "}
      {status.message}
    </div>
  );
}
