const QUOTE_MODAL_LABELS = new Set(["Request a Quote", "Renew Subscription", "Get Your Quote Now"]);

export function shouldOpenQuoteModal(link: HTMLAnchorElement): boolean {
  if (link.closest(".aptus-quote-modal")) return false;

  const href = link.getAttribute("href")?.trim() ?? "";
  const hrefLower = href.toLowerCase();

  if (hrefLower === "#form") return true;
  if (href.includes("popup") || href.includes("elementor-action")) return true;

  const label = link.textContent?.replace(/\s+/g, " ").trim();
  return label ? QUOTE_MODAL_LABELS.has(label) : false;
}

// ponytail: self-check — fails if quote link detection regresses
if (process.env.NODE_ENV === "development") {
  const mk = (href: string, text: string) =>
    ({
      getAttribute: (name: string) => (name === "href" ? href : null),
      textContent: text,
      closest: () => null,
    }) as unknown as HTMLAnchorElement;

  console.assert(shouldOpenQuoteModal(mk("#form", "Request a Quote")) === true);
  console.assert(shouldOpenQuoteModal(mk("#form", "Renew Subscription")) === true);
  console.assert(shouldOpenQuoteModal(mk("#Products", "Request a Quote")) === true);
  console.assert(shouldOpenQuoteModal(mk("#Products", "Browse Products")) === false);
}
