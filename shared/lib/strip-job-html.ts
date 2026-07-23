/**
 * Strip Odoo job HTML (or already-plain API text) to readable plain text.
 * Collapses indent/blank-line bloat that `white-space: pre-line` would paint as gaps.
 */
export function stripJobHtml(html: string): string {
  // ponytail: \u0001 marks list-item starts so soft-wrap join won't glue bullets.
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\u0001• ")
    .replace(/<\/li>/gi, "")
    // Block ends become paragraph breaks; empty blocks collapse below.
    .replace(/<\/(p|div|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    // HTML source soft-wraps → single space; keep real paragraph breaks.
    .replace(/([^\n])\n(?!\n)/g, "$1 ")
    .replace(/ {2,}/g, " ")
    .replace(/\u0001/g, "\n")
    .replace(/ +$/gm, "")
    // One newline is enough — blank lines were the job-detail whitespace bug.
    .replace(/\n{2,}/g, "\n")
    .trim();
}
