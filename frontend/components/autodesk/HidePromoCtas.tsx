"use client";

import { useEffect } from "react";

const PROMO =
  /free\s*trial|start\s+free(\s+trial|\s+trail)?|access\s+25\s*%|25\s*%\s*savings|start\s+for\s+free/i;

/** Hides trial / savings promo CTAs inside the Autodesk replica. */
export function HidePromoCtas() {
  useEffect(() => {
    const root = document.querySelector("[data-ad-root]");
    if (!root) return;

    const hide = () => {
      root.querySelectorAll("a, button").forEach((el) => {
        const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
        if (PROMO.test(text)) {
          (el as HTMLElement).hidden = true;
          (el as HTMLElement).style.display = "none";
        }
      });
    };

    hide();
    const mo = new MutationObserver(hide);
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, []);

  return null;
}
