"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthProvider";

const BLOCKED_KEYS = new Set(["c", "x", "a", "p", "s", "u", "insert"]);

async function wipeClipboard(): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText("");
    }
  } catch {
    // ignore
  }
}

function clearSelection(): void {
  const selection = window.getSelection?.();
  if (selection && selection.rangeCount > 0) {
    selection.removeAllRanges();
  }
}

function blockCopyHandler(event: { preventDefault: () => void; stopPropagation: () => void }) {
  event.preventDefault();
  event.stopPropagation();
  clearSelection();
  void wipeClipboard();
}

/**
 * Sensitive portal pages stay hidden until the user actively holds Space or the
 * Reveal control. OS Print Screen / Snipping Tool freeze the display; hiding by
 * default is the only reliable browser defense against those captures.
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
  const [revealed, setRevealed] = useState(false);
  const holdingRef = useRef(false);
  const watermark = user?.email || user?.name || "Aptus portal";

  const hide = useCallback(() => {
    holdingRef.current = false;
    setRevealed(false);
    clearSelection();
    void wipeClipboard();
  }, []);

  const show = useCallback(() => {
    if (document.visibilityState !== "visible" || !document.hasFocus()) return;
    holdingRef.current = true;
    setRevealed(true);
  }, []);

  useEffect(() => {
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

    const blockEvent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const code = event.code;

      // Any capture shortcut → hide immediately (before OS freeze when possible).
      if (
        key === "printscreen" ||
        code === "PrintScreen" ||
        (event.metaKey && event.shiftKey) ||
        (event.ctrlKey && event.shiftKey && (key === "s" || key === "x" || key === "p"))
      ) {
        hide();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (key === " " || code === "Space") {
        // Hold Space to reveal — do not toggle; keep showing while held.
        if (!event.repeat) show();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const mod = event.ctrlKey || event.metaKey;
      if (
        (mod && BLOCKED_KEYS.has(key)) ||
        (event.shiftKey && key === "insert") ||
        key === "f12"
      ) {
        event.preventDefault();
        event.stopPropagation();
        clearSelection();
        void wipeClipboard();
        if (key === "f12") hide();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const code = event.code;
      if (key === " " || code === "Space") {
        hide();
        event.preventDefault();
        return;
      }
      if (key === "printscreen" || code === "PrintScreen") {
        hide();
        void wipeClipboard();
      }
    };

    const onBlurOrHidden = () => {
      hide();
    };

    const onMouseUp = () => clearSelection();

    const onBeforePrint = () => hide();

    document.addEventListener("copy", blockCopy, true);
    document.addEventListener("cut", blockCopy, true);
    document.addEventListener("paste", blockEvent, true);
    document.addEventListener("contextmenu", blockEvent, true);
    document.addEventListener("selectstart", blockEvent, true);
    document.addEventListener("dragstart", blockEvent, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("mouseup", onMouseUp, true);
    window.addEventListener("blur", onBlurOrHidden);
    document.addEventListener("visibilitychange", onBlurOrHidden);
    window.addEventListener("beforeprint", onBeforePrint);
    // If focus is lost (Snipping Tool), hide within the same tick as possible.
    const focusPoll = window.setInterval(() => {
      if (!holdingRef.current) return;
      if (document.visibilityState !== "visible" || !document.hasFocus()) {
        hide();
      }
    }, 50);

    return () => {
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
      window.removeEventListener("blur", onBlurOrHidden);
      document.removeEventListener("visibilitychange", onBlurOrHidden);
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, [hide, show]);

  // Global pointer release ends button hold.
  useEffect(() => {
    const endHold = () => {
      if (holdingRef.current) hide();
    };
    window.addEventListener("pointerup", endHold);
    window.addEventListener("pointercancel", endHold);
    return () => {
      window.removeEventListener("pointerup", endHold);
      window.removeEventListener("pointercancel", endHold);
    };
  }, [hide]);

  return (
    <div
      ref={rootRef}
      className={`aptus-sensitive-content${revealed ? " is-revealed" : " is-shielded"}${className ? ` ${className}` : ""}`}
      data-aptus-sensitive="true"
      onCopy={blockCopyHandler}
      onCut={blockCopyHandler}
      onPaste={blockCopyHandler}
      onContextMenu={blockCopyHandler}
      aria-live="polite"
    >
      <div className="aptus-sensitive-content__body" aria-hidden={!revealed}>
        <div className="aptus-sensitive-content__watermark" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index}>{watermark}</span>
          ))}
        </div>
        {children}
      </div>

      {!revealed ? (
        <div className="aptus-sensitive-content__shield">
          <div className="aptus-sensitive-content__gate">
            <p className="aptus-sensitive-content__gate-title">Protected content</p>
            <p>
              Details stay hidden to block Print Screen and Snipping Tool. Hold to view —
              release and the page hides again.
            </p>
            <button
              type="button"
              className="aptus-sensitive-content__hold-btn"
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                show();
              }}
            >
              Hold to view
            </button>
            <p className="aptus-sensitive-content__gate-hint">Or hold the Space bar</p>
          </div>
        </div>
      ) : (
        <div className="aptus-sensitive-content__live-bar" role="status">
          Viewing protected details — release Space / mouse to hide
        </div>
      )}
    </div>
  );
}
