"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const BLOCKED_KEYS = new Set(["c", "x", "a", "p", "s", "u", "insert"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

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
 * Client-side deterrent: entire portal profile content cannot be copied.
 * Form fields remain editable (select/paste allowed). OS screenshots cannot be fully blocked.
 */
export function SensitiveContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shielded, setShielded] = useState(false);
  const captureLockRef = useRef(false);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousWebkitUserSelect = (document.body.style as CSSStyleDeclaration & {
      webkitUserSelect?: string;
    }).webkitUserSelect;
    document.body.style.userSelect = "none";
    (document.body.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect =
      "none";
    document.body.setAttribute("data-aptus-copy-blocked", "true");

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
    };

    const blockUnlessEditable = (event: Event) => {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
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
      const editable = isEditableTarget(event.target);

      // Copy / cut always blocked — including from profile form fields.
      if (
        (mod && (key === "c" || key === "x" || key === "insert")) ||
        (event.shiftKey && key === "insert")
      ) {
        event.preventDefault();
        event.stopPropagation();
        clearSelection();
        void wipeClipboard();
        return;
      }

      // Select-all / print / save / view-source — blocked outside editable fields.
      if (!editable && mod && BLOCKED_KEYS.has(key)) {
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

    const onMouseUp = (event: MouseEvent) => {
      if (isEditableTarget(event.target)) return;
      clearSelection();
    };

    const onBeforePrint = () => engageCaptureShield(2000);
    const onAfterPrint = () => {
      captureLockRef.current = false;
      syncShield();
    };

    document.addEventListener("copy", blockCopy, true);
    document.addEventListener("cut", blockCopy, true);
    document.addEventListener("contextmenu", blockUnlessEditable, true);
    document.addEventListener("selectstart", blockUnlessEditable, true);
    document.addEventListener("dragstart", blockUnlessEditable, true);
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
      (document.body.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect =
        previousWebkitUserSelect ?? "";
      document.body.removeAttribute("data-aptus-copy-blocked");
      document.removeEventListener("copy", blockCopy, true);
      document.removeEventListener("cut", blockCopy, true);
      document.removeEventListener("contextmenu", blockUnlessEditable, true);
      document.removeEventListener("selectstart", blockUnlessEditable, true);
      document.removeEventListener("dragstart", blockUnlessEditable, true);
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
      onContextMenu={(event) => {
        if (!isEditableTarget(event.target)) blockCopyHandler(event);
      }}
      aria-live="polite"
    >
      <div className="aptus-sensitive-content__body">
        {children}
      </div>
      <div className="aptus-sensitive-content__shield" aria-hidden={!shielded}>
        <p>Copying is blocked across your account profile. Content is hidden while inactive.</p>
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
