/**
 * Strip Odoo job HTML (or already-plain API text) to readable plain text.
 * Collapses indent/blank-line bloat that `white-space: pre-line` would paint as gaps,
 * but keeps bullet / section line breaks so job detail doesn't become one wall of text.
 */
export function stripJobHtml(html: string): string {
  // ponytail: \u0001 marks list-item starts so soft-wrap join won't glue bullets.
  return (
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\u0001• ")
      .replace(/<\/li>/gi, "")
      // Block ends become paragraph breaks; empty blocks collapse below.
      .replace(/<\/(p|div|h[1-6]|ul|ol)>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      // Plain-text bullets (Odoo Description often lands this way after strip).
      .replace(/(^|\n)\s*[•\u2022]\s*/g, "\n\u0001• ")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      // Soft-wrap join only when the next line continues a sentence (lowercase).
      // Uppercase / bullets / markers stay as real line breaks (Odoo section titles).
      .replace(/([^\n])\n(?=[a-z])/g, "$1 ")
      .replace(/ {2,}/g, " ")
      .replace(/\u0001/g, "\n")
      // Any glued " • " left from mixed HTML still splits onto its own line.
      .replace(/([^\n])\s+• /g, "$1\n• ")
      .replace(/ +$/gm, "")
      // One newline is enough — blank lines were the job-detail whitespace bug.
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}
