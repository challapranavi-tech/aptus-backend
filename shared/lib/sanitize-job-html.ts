/**
 * Allowlist sanitizer for Odoo hr.job HTML shown on careers detail.
 * No extra deps — strips scripts/iframes/handlers; keeps basic formatting tags.
 */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "div",
  "a",
]);

export function sanitizeJobHtml(html: string): string {
  if (!html.trim()) return "";

  let out = html
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button)[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, " $1=\"#\"");

  out = out.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (full, rawName: string, attrs = "") => {
    const name = rawName.toLowerCase();
    const closing = full.startsWith("</");
    if (!ALLOWED_TAGS.has(name)) return "";
    if (closing) return `</${name}>`;

    if (name === "br") return "<br/>";

    if (name === "a") {
      const hrefMatch = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "").trim();
      if (!href || /^javascript:/i.test(href)) return "<a>";
      const safe = href.replace(/"/g, "&quot;");
      return `<a href="${safe}" rel="noopener noreferrer" target="_blank">`;
    }

    // Keep the Key Responsibilities marker class used by careers detail CSS.
    if (name === "p") {
      const clsMatch = attrs.match(/\sclass\s*=\s*("([^"]*)"|'([^']*)')/i);
      const cls = (clsMatch?.[2] ?? clsMatch?.[3] ?? "").trim();
      if (cls === "aptus-jobdetail__key") {
        return `<p class="aptus-jobdetail__key">`;
      }
    }

    return `<${name}>`;
  });

  return out.trim();
}
