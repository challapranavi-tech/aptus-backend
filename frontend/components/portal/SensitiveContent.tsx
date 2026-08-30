"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthProvider";

const BLOCKED_KEYS = new Set(["c", "x", "a", "p", "s", "u", "insert"]);

function isScreenshotShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const code = event.code;

  if (key === "printscreen" || code === "PrintScreen") return true;
  if (event.metaKey && event.shiftKey && key === "s") return true;
  if (event.metaKey && event.shiftKey && (key === "3" || key === "4" || key === "5")) {
    return true;
  }
  if (event.ctrlKey && event.shiftKey && (key === "s" || key === "x" || key === "p")) {
    return true;
  }
  return false;
}

async function wipeClipboard(): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText("");
    }
  } catch {
    // Clipboard permission may be denied; ignore.
  }
}

function clearSelection(): void {
  const selection = window.getSelection?.();
  if (selection && selection.rangeCount > 0) {
    selection.removeAllRanges();
  }
}

/**
 * Blocks copy/cut and deters screenshots on sensitive portal views.
 */
export function SensitiveContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { user } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [shielded, setShielded] = useState(false);
  const captureLockRef = useRef(false);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watermark = user?.email || user?.name || "Aptus portal";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousWebkitUserSelect = document.body.style.webkitUserSelect;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.body.setAttribute("data-aptus-copy-blocked", "true");

    const originalWriteText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    const originalWrite = navigator.clipboard?.write?.bind(navigator.clipboard);
    if (navigator.clipboard) {
      navigator.clipboard.writeText = async () => {
        throw new Error("Copying is disabled on this page.");
      };
      navigator.clipboard.write = async () => {
        throw new Error("Copying is disabled on this page.");
      };
    }

    const clearCaptureTimer = () => {
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
        captureTimerRef.current = null;
      }
    };

    const engageCaptureShield = (holdMs = 4000) => {
      captureLockRef.current = true;
      setShielded(true);
      clearSelection();
      void wipeClipboard();
      window.setTimeout(() => void wipeClipboard(), 120);
      window.setTimeout(() => void wipeClipboard(), 400);
      window.setTimeout(() => void wipeClipboard(), 1000);

      clearCaptureTimer();
      captureTimerRef.current = setTimeout(() => {
        captureLockRef.current = false;
        if (document.visibilityState === "visible" && document.hasFocus()) {
          setShielded(false);
        }
      }, holdMs);
    };

    const syncShield = () => {
      if (captureLockRef.current) {
        setShielded(true);
        return;
      }
      const shouldShield = document.visibilityState !== "visible" || !document.hasFocus();
      setShielded(shouldShield);
      if (shouldShield) {
        clearSelection();
        void wipeClipboard();
      }
    };

    const blockCopy = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if ("clipboardData" in event && event.clipboardData) {
        try {
          (event as ClipboardEvent).clipboardData?.setData("text/plain", "");
        } catch {
          // ignore
        }
      }
      clearSelection();
      void wipeClipboard();
      return false;
    };

    const blockEvent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isScreenshotShortcut(event)) {
        engageCaptureShield(5000);
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;

      // Copy / cut / select-all / print / save — always blocked on sensitive pages.
      if (
        (mod && BLOCKED_KEYS.has(key)) ||
        (event.shiftKey && key === "insert") ||
        (mod && event.shiftKey && key === "c")
      ) {
        event.preventDefault();
        event.stopPropagation();
        clearSelection();
        void wipeClipboard();
        return;
      }

      if (key === "f12") {
        engageCaptureShield(3000);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "printscreen" || event.code === "PrintScreen") {
        engageCaptureShield(5000);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onMouseUp = () => {
      clearSelection();
    };

    const onBeforePrint = () => engageCaptureShield(2000);
    const onAfterPrint = () => {
      captureLockRef.current = false;
      syncShield();
    };

    document.addEventListener("copy", blockCopy, true);
    document.addEventListener("cut", blockCopy, true);
    document.addEventListener("paste", blockEvent, true);
    document.addEventListener("contextmenu", blockEvent, true);
    document.addEventListener("selectstart", blockEvent, true);
    document.addEventListener("dragstart", blockEvent, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("mouseup", onMouseUp, true);
    window.addEventListener("blur", syncShield);
    window.addEventListener("focus", syncShield);
    document.addEventListener("visibilitychange", syncShield);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);

    const focusPoll = window.setInterval(() => {
      if (captureLockRef.current) return;
      const inactive = document.visibilityState !== "visible" || !document.hasFocus();
      setShielded((current) => (current === inactive ? current : inactive));
    }, 200);

    return () => {
      clearCaptureTimer();
      window.clearInterval(focusPoll);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.webkitUserSelect = previousWebkitUserSelect;
      document.body.removeAttribute("data-aptus-copy-blocked");
      if (navigator.clipboard) {
        if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
        if (originalWrite) navigator.clipboard.write = originalWrite;
      }
      document.removeEventListener("copy", blockCopy, true);
      document.removeEventListener("cut", blockCopy, true);
      document.removeEventListener("paste", blockEvent, true);
      document.removeEventListener("contextmenu", blockEvent, true);
      document.removeEventListener("selectstart", blockEvent, true);
      document.removeEventListener("dragstart", blockEvent, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("mouseup", onMouseUp, true);
      window.removeEventListener("blur", syncShield);
      window.removeEventListener("focus", syncShield);
      document.removeEventListener("visibilitychange", syncShield);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`aptus-sensitive-content${shielded ? " is-shielded" : ""}${className ? ` ${className}` : ""}`}
      data-aptus-sensitive="true"
      onCopy={blockCopyHandler}
      onCut={blockCopyHandler}
      onPaste={blockCopyHandler}
      onContextMenu={blockCopyHandler}
      aria-live="polite"
    >
      <div className="aptus-sensitive-content__body">
        <div className="aptus-sensitive-content__watermark" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index}>{watermark}</span>
          ))}
        </div>
        {children}
      </div>
      <div className="aptus-sensitive-content__shield" aria-hidden={!shielded}>
        <p>Copying and screenshots are blocked on this page. Content is hidden while inactive.</p>
      </div>
    </div>
  );
}

function blockCopyHandler(event: { preventDefault: () => void; stopPropagation: () => void }) {
  event.preventDefault();
  event.stopPropagation();
  clearSelection();
  void wipeClipboard();
}
